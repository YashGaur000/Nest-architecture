import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  BaanxCreateUser,
  BaanxUserDto,
  BaanxUserKyc,
  BaanxUserKycDto,
  BaanxUserKycStatus,
  BaanxUserPassKycDto,
  BaanxUserSessionDto,
} from '../dto/baanx-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { BAANX_ACCESS_TOKEN, BAANX_API } from '../../../environments';
import {
  BaanxUserKycResponse,
  BaanxUserResponse,
  BaanxUserSessionResponse,
} from '../models/baanx-user.model';
import { BaanxUserRepository } from '../repositories/baanx-user.repository';
import { BaanxCurrency } from '../common/enums';

@Injectable()
export class BaanxUserService {
  constructor(
    private readonly httpService: HttpService,
    private readonly baanxUserRepository: BaanxUserRepository,
  ) {}

  async createUser(baanxUserDto: BaanxUserDto): Promise<BaanxUserResponse> {
    try {
      Logger.log('BaanxUser creation start');
      let user = await this.baanxUserRepository.getUserByIdentity(
        baanxUserDto.identity,
      );
      if (!user) {
        user = await this.baanxUserRepository.createBaseUser(
          baanxUserDto.identity,
          uuidv4(),
        );
      }

      delete baanxUserDto.identity;
      const payload: BaanxCreateUser = {
        external_id: user.external_id,
        title: baanxUserDto.title,
        gender: baanxUserDto.gender,
        addressLine1: baanxUserDto.addressLine1,
        addressLine2: baanxUserDto.addressLine2,
        cityOrTown: baanxUserDto.cityOrTown,
        countryName: baanxUserDto.countryName,
        country_code: baanxUserDto.country_code,
        first_name: baanxUserDto.first_name,
        last_name: baanxUserDto.last_name,
        selected_country: baanxUserDto.selected_country, //country ISO 3166 alpha-3 code
        email: baanxUserDto.email,
        phone_number: baanxUserDto.phone_number,
        postcode: baanxUserDto.postcode,
        dateOfBirth: baanxUserDto.dateOfBirth, // Date ISO
      };
      return this.httpService
        .post(`${BAANX_API}/v1/user`, payload, {
          headers: {
            Authorization: BAANX_ACCESS_TOKEN,
          },
        })
        .toPromise()
        .then(({ data }) => {
          if (data.error) {
            Logger.error(
              'BaanxUser creation failed',
              JSON.stringify(data.error),
            );
            throw new HttpException(
              'Something went wrong. Please try again later',
              HttpStatus.BAD_REQUEST,
            );
          }

          Logger.log('BaanxUser creation finished');
          return data;
        });
    } catch (e) {
      Logger.error('BaanxUser creation failed', e);
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async initUserSession(
    baanxUserSessionDto: BaanxUserSessionDto,
  ): Promise<BaanxUserSessionResponse> {
    const user = await this.baanxUserRepository.getUserByIdentity(
      baanxUserSessionDto.identity,
    );

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const baanxUser = await this.httpService
      .get(`${BAANX_API}/v1/user/${user.external_id}`, {
        headers: {
          Authorization: BAANX_ACCESS_TOKEN,
        },
      })
      .toPromise()
      .then(({ data }) => {
        if (data.error) {
          Logger.error(
            'BaanxUser get user info failed',
            JSON.stringify(data.error),
          );
          throw new HttpException(
            'Something went wrong. Please try again later',
            HttpStatus.BAD_REQUEST,
          );
        }

        return data;
      });

    // if (user.kyc_status !== BaanxKycStatus.VERIFIED) {
    //   return {
    //     kyc_status: user.kyc_status || null,
    //     reference_codes: {
    //       [BaanxCurrency.EUR]: `KASH${BaanxCurrency.EUR}${user.external_id}`,
    //       [BaanxCurrency.GBP]: `KASH${BaanxCurrency.GBP}${user.external_id}`
    //     },
    //     user_pass_kyc: user.user_pass_kyc || false,
    //     kyc_reason: user?.kyc_reason,
    //     user: baanxUser,
    //     session: null,
    //   };
    // }

    return this.httpService
      .post(
        `${BAANX_API}/v1/session`,
        { externalId: user.external_id },
        {
          headers: {
            Authorization: BAANX_ACCESS_TOKEN,
          },
        },
      )
      .toPromise()
      .then(({ data }) => {
        if (data.error) {
          Logger.error(
            'Baanx initUserSession failed',
            JSON.stringify(data.error),
          );
          throw new HttpException(
            'Init User Session failed',
            HttpStatus.BAD_REQUEST,
          );
        }
        return {
          kyc_status: user.kyc_status || null,
          kyc_reason: user?.kyc_reason,
          reference_codes: {
            [BaanxCurrency.EUR]: `KASH${BaanxCurrency.EUR}${user.external_id}`,
            [BaanxCurrency.GBP]: `KASH${BaanxCurrency.GBP}${user.external_id}`,
          },
          user_pass_kyc: user.user_pass_kyc || false,
          user: baanxUser,
          session: data,
        };
      });
  }

  async submitUserKyc(baanxUserKycDto: BaanxUserKycDto): Promise<void> {
    const user = await this.baanxUserRepository.getUserByIdentity(
      baanxUserKycDto.identity,
    );

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const baanxUserKyc: BaanxUserKyc = {
      externalId: user.external_id,
      images: baanxUserKycDto.images,
    };

    await this.baanxUserRepository.updateUser(user.identity, {
      kyc_status: null,
      kyc_reason: null,
      kyc_request_id: null,
    });

    const response: BaanxUserKycResponse = await this.httpService
      .post(`${BAANX_API}/v1/kyc/submit`, baanxUserKyc, {
        headers: {
          Authorization: BAANX_ACCESS_TOKEN,
        },
      })
      .toPromise()
      .then(({ data }) => {
        if (data.error) {
          Logger.error(
            'Submit KYC verification failed',
            JSON.stringify(data.error),
          );
          throw new HttpException(
            'Submit KYC verification failed',
            HttpStatus.BAD_REQUEST,
          );
        }
        return data;
      });

    if (response.requestId) {
      await this.baanxUserRepository.updateUser(baanxUserKycDto.identity, {
        kyc_request_id: response.requestId,
      });
    } else {
      throw new HttpException(
        'Submit KYC verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async userKycStatusUpdate(
    baanxUserKycStatus: BaanxUserKycStatus,
  ): Promise<void> {
    try {
      Logger.log(baanxUserKycStatus, 'Baanx User Kyc Status');
      const user = await this.baanxUserRepository.getUserByKycRequestId(
        baanxUserKycStatus.requestId,
      );
      if (!user) {
        Logger.error('UserKycStatusUpdate User not found');
        return;
      }

      await this.baanxUserRepository.updateUser(user.identity, {
        kyc_status: baanxUserKycStatus.requestStatus,
        kyc_reason: baanxUserKycStatus?.reason,
      });
      Logger.log('UserKycStatusUpdate finished');
    } catch (e) {
      Logger.error(e, 'UserKycStatusUpdate failed');
    }
  }

  async userPassKyc(baanxUserPassKycDto: BaanxUserPassKycDto) {
    const user = await this.baanxUserRepository.getUserByIdentity(
      baanxUserPassKycDto.identity,
    );

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    try {
      await this.baanxUserRepository.updateUser(user.identity, {
        user_pass_kyc: true,
      });
      Logger.log('User Pass Kyc');
    } catch (e) {
      Logger.error(e, 'User Pass Kyc failed');
    }
  }
}
