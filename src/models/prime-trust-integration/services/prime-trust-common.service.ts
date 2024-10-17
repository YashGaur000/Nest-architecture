import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PRIME_TRUST_API } from 'src/environments';
import { PrimeTrustApi } from '../enums/pt-enums';
import { HttpService } from '@nestjs/axios';
import { COMMON_ERROR } from 'src/common/errors';
import { PrimeTrustJwtService } from './prime-trust-jwt.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PrimeTrustCommonService {
  constructor(
    private readonly httpService: HttpService,
    private readonly primeTrustJwtService: PrimeTrustJwtService,
  ) {}

  getHeaders() {
    const jwtToken = this.primeTrustJwtService.getJwtToken();
    return {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    };
  }

  async intercomPTStatus(account_id: string): Promise<string> {
    try {
      return (
        await firstValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.accounts}/${account_id}`,
            this.getHeaders(),
          ),
        )
      )?.data?.data?.attributes?.status;
    } catch (error) {
      Logger.error('Intercom get PT status Failed', error?.response?.data);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : COMMON_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
