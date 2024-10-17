import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  PRIME_TRUST_JWT_PASSWORD,
  PRIME_TRUST_JWT_URL,
  PRIME_TRUST_JWT_USERNAME,
} from '../config/config';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PrimeTrustJwtService implements OnModuleInit {
  private jwtToken: string;
  onModuleInit(): void {
    Logger.log('PrimeTrustJwt -> onModuleInit triggered');
    this.updateJwtToken().then(() =>
      Logger.log('PrimeTrustJwt -> onModuleInit triggered -> JWT updated'),
    );
  }

  constructor(private readonly httpService: HttpService) {}

  getJwtToken(): string {
    return this.jwtToken;
  }

  setJwtToken(jwt: string): void {
    this.jwtToken = jwt;
  }

  async updateJwtToken(): Promise<void> {
    const response = await lastValueFrom(
      this.httpService
        .post<{ token: string }>(
          PRIME_TRUST_JWT_URL,
          {},
          {
            auth: {
              username: PRIME_TRUST_JWT_USERNAME,
              password: PRIME_TRUST_JWT_PASSWORD,
            },
          },
        )
        .pipe(map(({ data }) => data)),
    ).catch((error) => {
      Logger.error(
        'Failed to generate new Prime Trust JWT token',
        JSON.stringify(error),
      );
      return error;
    });

    if (response && response.token) {
      this.setJwtToken(response.token);
    } else {
      Logger.error('Prime Trust JWT token is empty');
    }
  }
}
