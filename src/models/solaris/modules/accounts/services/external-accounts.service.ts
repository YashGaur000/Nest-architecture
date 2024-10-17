import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SolarisAuthService } from '../../auth/services/solaris-auth.service';
import { SOLARIS_API } from '../../../config/app.config';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import {
  CreateAccountInput,
  CreateAccountResponse,
  GetAccountResponse,
} from '../intefaces/accounts.interfaces';

@Injectable()
export class SolarisExternalAccountService {
  constructor(
    private readonly httpService: HttpService,
    private readonly solarisAuthService: SolarisAuthService,
  ) {}

  async createAccount(
    personId: string,
    createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<CreateAccountResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/accounts`,
        createAccountInput,
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

    return lastValueFrom<CreateAccountResponse>(observable).catch((error) => {
      Logger.error('Failed to create a account, error', JSON.stringify(error));
      throw new HttpException(
        'Failed to create a account, error',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async getAccount(
    personId: string,
    accountId: string,
  ): Promise<GetAccountResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .get<CreateAccountResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/accounts/${accountId}`,
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

    return lastValueFrom<CreateAccountResponse>(observable).catch((error) => {
      Logger.error(
        'Failed to get account details, error',
        JSON.stringify(error),
      );
      throw new HttpException(
        'Failed to get account details',
        HttpStatus.BAD_REQUEST,
      );
    });
  }
}
