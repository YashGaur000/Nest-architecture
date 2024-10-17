import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PRIME_TRUST_API } from 'src/environments';
import {
  PrimeTrustApi,
  PrimeTrustCardActions,
  PrimeTrustCardStatus,
  PrimeTrustTypes,
} from '../enums/pt-enums';
import { PrimeTrustUserRepository } from '../repositories/prime-trust-user.repository';
import { PrimeTrustUser } from '../schemas/prime-trust-user.schema';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { UserProfileService } from '../../user/services/user-profile.service';
import { PrimeTrustJwtService } from './prime-trust-jwt.service';

@Injectable()
export class PrimeTrustCardService {
  constructor(
    private readonly httpService: HttpService,
    private readonly primeTrustUserRepository: PrimeTrustUserRepository,
    private readonly userProfileService: UserProfileService,
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

  async getContactDetails(
    identity: string,
  ): Promise<{ email: string; number: string }> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      const res = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}?id=${user.contact_id}&include=phone-numbers`,
            this.getHeaders(),
          ),
        )
      )?.data;
      return {
        email: res.data[0].attributes.email,
        number: res.included[0].attributes['client-input'],
      };
    } catch (error) {
      Logger.log('conatct details error=>', error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEmail(contact_id: string) {
    try {
      const res = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}?id=${contact_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;
      return res?.data[0]?.attributes?.email;
    } catch (error) {
      Logger.log(error.response.data);
    }
  }

  async createCardObject(identity: string, user: PrimeTrustUser) {
    try {
      //const contact_details = await this.getContactDetails(identity);
      Logger.log('acc=>', user.account_id, 'cont=>', user.contact_id);
      const req = {
        data: {
          type: PrimeTrustTypes.card_issuance,
          attributes: {
            'account-id': user.account_id,
            'contact-id': user.contact_id,
          },
        },
      };

      const res = (
        await lastValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.card}?include=card-holder-verification`,
            req,
            this.getHeaders(),
          ),
        )
      )?.data; // access the data.included[0].id (For card holder verification ID) ACCESS data.data.id (For Card Holder Object ID)
      Logger.log('res', res);
      if (!res || !res.included) return;
      user.card_verification_id = res.included[0].id;
      //user.card_id = res.included[0].id; // access the card id along with the card holder verification id
      user.card_object_id = res.data.id;
      user.card_status = PrimeTrustCardStatus.EMAIL_VERIFICATION;
      user.card_id = res.included[1].id;
      await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
        identity,
        user,
      );

      // update the card_initiated value to true over here in the user schema.
    } catch (error) {
      Logger.log('create obj error =>', error);
      Logger.log(
        'create obj error source=>',
        error.response.data.errors[0].source,
      );
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Both verifications are now complete. Once completed, the cardholder verification object will be marked as fully verified and the virtual card will be issued.
  // The cardholder phone verification call provides a card-display-token used to display the card. The token is good for a one-time use. You can also call POST /v2/cards/resource-token to retrieve a new token.

  async createEmailVerification(
    identity: string,
  ): Promise<{ success: boolean }> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      await lastValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.card_verification}/${user.card_verification_id}/request-email-verification`, //user.card_verification_id
          this.getHeaders(),
        ),
      );
      return { success: true };
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createPhoneVerification(
    identity: string,
  ): Promise<{ success: boolean }> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      await lastValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.card_verification}/${user.card_verification_id}/request-phone-number-verification`, //user.card_verification_id
          this.getHeaders(),
        ),
      );
      return { success: true };
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyEmail(
    identity: string,
    otp: string,
  ): Promise<{ success: boolean }> {
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      const req = {
        data: {
          type: '',
          attributes: {
            'email-otp': otp,
          },
        },
      };
      await lastValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.card_verification}/${user.card_verification_id}/verify-email`, //user.card_verification_id
          req,
          this.getHeaders(),
        ),
      );
      return { success: true };
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyPhone(value: string, otp: string): Promise<{ success: boolean }> {
    try {
      const req = {
        data: {
          type: '',
          attributes: {
            'phone-number-otp': otp,
          },
        },
      };
      await lastValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.card_verification}/${value}/verify-phone-number`,
          req,
          this.getHeaders(),
        ),
      );
      return { success: true };
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCardVerification(identity: string): Promise<any> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      const response = await firstValueFrom(
        this.httpService.get(
          `${PRIME_TRUST_API}${PrimeTrustApi.card_verification}/${user.card_object_id}`,
          this.getHeaders(),
        ),
      );

      return {
        'email-verified': response.data.attributes['email-verified'],
        'phone-number-verified':
          response.data.attributes['phone-number-verified'],
        'card-display-token': response.data.attributes['card-display-token'],
      };
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCardIssuanceStatus(identity: string): Promise<{ status: string }> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      if (!user.card_object_id) {
        this.createCardObject(identity, user);
      }
      //get the card_initiated status from the above user schema

      return {
        status: user.card_status
          ? user.card_status
          : PrimeTrustCardStatus.PHONE_VERIFICATION,
      };
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cardActions(identity: string, action: PrimeTrustCardActions) {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      const url = `${PRIME_TRUST_API}${PrimeTrustApi.physical_card}/${user.card_id}/${action}`;
      const res = await lastValueFrom(
        this.httpService.post(url, undefined, this.getHeaders()),
      );
      return res.data;
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
