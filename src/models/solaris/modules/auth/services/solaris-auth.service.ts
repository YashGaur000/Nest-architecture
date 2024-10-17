import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SOLARIS_API,
  SOLARIS_API_KEY,
  SOLARIS_API_SECRET,
} from '../../../config/app.config';
import { SolarisAuthResponse } from '../../person/intefaces/person-interfaces';

@Injectable()
export class SolarisAuthService {
  constructor(private readonly httpService: HttpService) {}

  authentication(): Promise<SolarisAuthResponse> {
    const observable = this.httpService
      .post<SolarisAuthResponse>(`${SOLARIS_API}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: SOLARIS_API_KEY,
        client_secret: SOLARIS_API_SECRET,
      })
      .pipe(map(({ data }) => data));

    return lastValueFrom<SolarisAuthResponse>(observable).catch((error) => {
      Logger.error('Failed to authorize, error', JSON.stringify(error));
      throw new HttpException('Failed to authorize', HttpStatus.BAD_REQUEST);
    });
  }
}
