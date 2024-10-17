import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreatePersonDto } from '../dto/create-person.dto';
import {
  SolarisCreatePersonInput,
  SolarisExternalPerson,
  SolarisGenerateIdentificationUrlResponse,
  SolarisPerson,
} from '../intefaces/person-interfaces';
import { SolarisExternalPersonsService } from './external-persons.service';
import { SolarisPersonRepository } from '../repositories/persons.repository';
import { UserProfileService } from '../../../../user/services/user-profile.service';
import {
  mapCreateIdentificationPayload,
  mapCreatePersonPayload,
  mapCreateTaxIdentificationPayload,
  mapSolarisPerson,
  mapUpdatePersonPayload,
} from '../mappers/person.mapper';
import { PersonIdentityDto } from '../dto/person-identity.dto';
import { PersonPhoneConfirmDto } from '../dto/person-phone-confirm.dto';
import * as _ from 'lodash';

@Injectable()
export class SolarisInternalPersonsService {
  constructor(
    private readonly externalPersonsService: SolarisExternalPersonsService,
    private readonly solarisPersonRepository: SolarisPersonRepository,
    private readonly userProfileService: UserProfileService,
  ) {}

  async createPerson(payload: CreatePersonDto): Promise<void> {
    try {
      const existingUser = await this.getPerson(payload.identity, false);

      if (existingUser) {
        throw new HttpException('User already exist', HttpStatus.BAD_REQUEST);
      }

      // Create a Person
      const createPersonDto = mapCreatePersonPayload(payload);
      const createdPerson = await this.externalPersonsService.createPerson(
        createPersonDto,
      );

      if (!createdPerson) {
        Logger.error('Solaris: Failed to create external person');
        throw new HttpException(
          'Failed to create person',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create Tax Identification
      const taxIdentification =
        await this.externalPersonsService.createTaxIdentification(
          createdPerson.id,
          mapCreateTaxIdentificationPayload(payload),
        );

      // Store Person data into Kash DB
      await this.solarisPersonRepository.createPerson({
        identity: payload.identity,
        account_approved: false,
        person_id: createdPerson.id,
        tax_identification: taxIdentification.id,
        pre_order_card_type: payload.card_plan,
        device: {},
      });

      // Create Mobile Number
      await this.externalPersonsService.createMobileNumber(
        createdPerson.id,
        createdPerson.mobile_number,
      );
      Logger.log('Solaris Person created');
    } catch (error) {
      Logger.error(error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async createIdentification(
    payload: PersonIdentityDto,
  ): Promise<SolarisGenerateIdentificationUrlResponse> {
    try {
      const person = await this.getPerson(payload.identity);

      const identification =
        await this.externalPersonsService.createIdentification(
          person.id,
          mapCreateIdentificationPayload(),
        );

      const generatedIdentification =
        await this.externalPersonsService.generateIdentificationUrl(
          person.id,
          identification.id,
        );

      await this.solarisPersonRepository.updatePerson(payload.identity, {
        identifications: {
          external_identification_id: identification.id,
          status: generatedIdentification.status,
          method: generatedIdentification.method,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          reference: generatedIdentification.reference,
        },
      });

      return generatedIdentification;
    } catch (error) {
      Logger.error(error, 'Solaris: Failed to create identification');
      throw new HttpException(
        'Failed to create identification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async mobileNumberConfirm(payload: PersonPhoneConfirmDto): Promise<void> {
    try {
      const person = await this.getPerson(payload.identity);

      await this.externalPersonsService.mobileNumberConfirm(
        person.id,
        person.mobile_number,
        payload.token,
      );
    } catch (error) {
      Logger.error(error, 'Solaris: Failed to mobile number confirm');
      throw new HttpException(
        'Failed to mobile number confirm',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async mobileNumberAuthorize(payload: PersonIdentityDto): Promise<void> {
    try {
      const person = await this.getPerson(payload.identity);

      await this.externalPersonsService.mobileNumberAuthorize(
        person.id,
        person.mobile_number,
      );
    } catch (error) {
      Logger.error(error, 'Solaris: Failed to mobile number authorize');
      throw new HttpException(
        'Failed to mobile number authorize',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getPerson(identity: string, trowError = true): Promise<SolarisPerson> {
    try {
      await this.userProfileService.checkUserByIdentity(identity);

      const internalPerson = await this.solarisPersonRepository.getPerson(
        identity,
      );

      if (!internalPerson) {
        if (trowError) {
          throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        } else {
          return null;
        }
      }

      const externalPerson = await this.externalPersonsService.getPerson(
        internalPerson.person_id,
      );
      if (!externalPerson) {
        if (trowError) {
          throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        } else {
          return null;
        }
      }

      return mapSolarisPerson(internalPerson, externalPerson);
    } catch (error) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
  }

  private getPersonAttributeForUpdate(
    createPersonInput: SolarisCreatePersonInput,
    externalPerson: SolarisExternalPerson,
  ) {
    const existingFields = mapUpdatePersonPayload(externalPerson);
    return _.reduce(
      createPersonInput,
      function (result, value, key) {
        return _.isEqual(value, existingFields[key])
          ? result
          : result.concat(key);
      },
      [],
    );
  }
}
