import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SolarisAuthService } from '../../auth/services/solaris-auth.service';
import { SOLARIS_API } from '../../../config/app.config';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import {
  MfaDeviceAddKeyInput,
  MfaDeviceAddKeyResponse,
  MfaDevicesInput,
  MfaDevicesResponse,
} from '../intefaces/device-binding.interfaces';

@Injectable()
export class SolarisExternalDeviceBindingService {
  constructor(
    private readonly httpService: HttpService,
    private readonly solarisAuthService: SolarisAuthService,
  ) {}

  async mfaDevices(
    mfaDevicesInput: MfaDevicesInput,
  ): Promise<MfaDevicesResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<MfaDevicesResponse>(
        `${SOLARIS_API}/v1/mfa/devices`,
        mfaDevicesInput,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<MfaDevicesResponse>(observable).catch((error) => {
      Logger.error('MFA device request failed, error', JSON.stringify(error));
      throw new HttpException(
        'MFA device request failed, error',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async mfaDeviceAddKey(
    deviceId: string,
    mfaDeviceAddKeyInput: MfaDeviceAddKeyInput,
  ): Promise<MfaDeviceAddKeyResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<MfaDeviceAddKeyResponse>(
        `${SOLARIS_API}/v1/mfa/devices/${deviceId}/keys`,
        mfaDeviceAddKeyInput,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<MfaDeviceAddKeyResponse>(observable).catch((error) => {
      Logger.error(
        'MFA device add key request failed, error',
        JSON.stringify(error),
      );
      throw new HttpException(
        'MFA device add key request failed, error',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async mfaSignature(challengeId: string, signature: string): Promise<void> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .put(
        `${SOLARIS_API}/v1/mfa/challenges/signatures/${challengeId}`,
        {
          signature,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom(observable).catch((error) => {
      Logger.error('MFA Signature failed, error', JSON.stringify(error));
      throw new HttpException('MFA Signature failed', HttpStatus.BAD_REQUEST);
    });
  }
}
