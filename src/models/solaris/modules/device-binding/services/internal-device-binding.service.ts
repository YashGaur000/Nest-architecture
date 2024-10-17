import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SolarisExternalDeviceBindingService } from './external-device-binding.service';
import { BindDeviceDto } from '../dto/bind-device.dto';
import {
  BindDeviceResponse,
  MfaDeviceAddKeyInput,
  MfaDevicesInput,
} from '../intefaces/device-binding.interfaces';
import { SolarisInternalPersonsService } from '../../person/services/internal-persons.service';
import { DeviceSignatureDto } from '../dto/device-signature.dto';
import DeviceDetector from 'device-detector-js';
import { DeviceResult } from 'device-detector-js/dist/parsers/device';
import { SolarisPersonRepository } from '../../person/repositories/persons.repository';
import { SolarisGCloudKmsService } from './g-cloud-kms.service';
import { v4 as uuidv4 } from 'uuid';
import { pemToHex } from '../../../utils/g-cloud-kms.utils';
import { AddKeyDeviceDto } from '../dto/add-key-device.dto';
import { DeviceKeyType } from '../enums/device.enums';

@Injectable()
export class SolarisInternalDeviceBindingService {
  constructor(
    private readonly solarisExternalDeviceBindingService: SolarisExternalDeviceBindingService,
    private readonly solarisInternalPersonsService: SolarisInternalPersonsService,
    private readonly solarisPersonRepository: SolarisPersonRepository,
    private readonly gCloudKmsService: SolarisGCloudKmsService,
  ) {}

  async bindDevice(bindDeviceDto: BindDeviceDto): Promise<BindDeviceResponse> {
    try {
      const person = await this.solarisInternalPersonsService.getPerson(
        bindDeviceDto.identity,
      );

      const internalPerson = await this.solarisPersonRepository.getPerson(
        bindDeviceDto.identity,
      );

      let restrictedKeyId;
      if (!internalPerson?.device?.restricted_key_id) {
        restrictedKeyId = uuidv4();
        await this.gCloudKmsService.createKeyAsymmetricSign(restrictedKeyId);
        Logger.log('Create key asymmetric sign');
      } else {
        restrictedKeyId = internalPerson?.device?.restricted_key_id;
        Logger.log('Use existing key asymmetric sign');
      }

      const updateFields = !internalPerson?.device
        ? { device: { restricted_key_id: restrictedKeyId } }
        : {
            $set: {
              'device.restricted_key_id': restrictedKeyId,
            },
          };

      await this.solarisPersonRepository.updatePerson(
        bindDeviceDto.identity,
        updateFields,
      );

      // Add unrestricted key to new device
      const unrestrictedPublicKey = await this.gCloudKmsService.getPublicKey(
        restrictedKeyId,
      );

      const mfaDevicesInput: MfaDevicesInput = {
        key: pemToHex(unrestrictedPublicKey),
        person_id: person.id,
        name: 'Device',
        key_type: 'ecdsa-p256',
        key_purpose: DeviceKeyType.UNRESTRICTED,
      };

      const device = await this.solarisExternalDeviceBindingService.mfaDevices(
        mfaDevicesInput,
      );

      await this.solarisPersonRepository.updatePerson(bindDeviceDto.identity, {
        $set: {
          'device.external_device_id': device.id,
        },
      });

      Logger.log('New device connected', device.id);

      return { challenge_id: device?.challenge?.id };
    } catch (error) {
      Logger.error(error, 'Solaris: Failed to connect device');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async addUnrestrictedKeyToDevice(
    addKeyDeviceDto: AddKeyDeviceDto,
  ): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        addKeyDeviceDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }

      let unrestrictedKeyId;
      if (!internalPerson?.device.unrestricted_key_id) {
        unrestrictedKeyId = uuidv4();
        await this.gCloudKmsService.createKeyAsymmetricSign(unrestrictedKeyId);
      } else {
        unrestrictedKeyId = internalPerson?.device.unrestricted_key_id;
      }

      const restrictedPublicKey = await this.gCloudKmsService.getPublicKey(
        internalPerson?.device?.restricted_key_id,
      );

      const signature = await this.gCloudKmsService.signAsymmetric(
        unrestrictedKeyId,
        restrictedPublicKey,
      );

      // Add restricted key to existing device
      const mfaDeviceAddKeyInput: MfaDeviceAddKeyInput = {
        key: pemToHex(restrictedPublicKey),
        key_purpose: DeviceKeyType.RESTRICTED,
        key_type: 'ecdsa-p256',
        device_signature: {
          signature,
          signature_key_purpose: DeviceKeyType.UNRESTRICTED,
        },
      };

      await this.solarisExternalDeviceBindingService.mfaDeviceAddKey(
        internalPerson?.device.external_device_id,
        mfaDeviceAddKeyInput,
      );

      await this.solarisPersonRepository.updatePerson(
        addKeyDeviceDto.identity,
        {
          $set: {
            'device.unrestricted_key_id': unrestrictedKeyId,
          },
        },
      );
    } catch (error) {
      Logger.error(error, 'Solaris: Failed to add new key to device');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async signature(deviceSignatureDto: DeviceSignatureDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        deviceSignatureDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }

      const keyID =
        deviceSignatureDto.key_type === DeviceKeyType.UNRESTRICTED
          ? internalPerson?.device.unrestricted_key_id
          : internalPerson?.device.restricted_key_id;

      const signature = await this.gCloudKmsService.signAsymmetric(
        keyID,
        deviceSignatureDto.otp,
      );

      const buff = Buffer.from(signature, 'base64');
      const hexSignature = buff.toString('hex');
      console.log(hexSignature);

      await this.solarisExternalDeviceBindingService.mfaSignature(
        deviceSignatureDto.challenge_id,
        hexSignature,
      );

      const field =
        deviceSignatureDto.key_type === DeviceKeyType.UNRESTRICTED
          ? 'device.unrestricted_key_verified'
          : 'device.restricted_key_verified';

      await this.solarisPersonRepository.updatePerson(
        deviceSignatureDto.identity,
        {
          $set: {
            [field]: true,
          },
        },
      );
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  getDeviceByUserAgent(userAgent: string): DeviceResult {
    const deviceDetector = new DeviceDetector();
    const parsedData = deviceDetector.parse(userAgent);
    return parsedData.device;
  }
}
