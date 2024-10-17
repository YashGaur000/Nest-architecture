import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decrypt, encrypt } from '../../../utils/crypto.utils';
import { PRIME_TRUST_MASTER_KEY } from '../../../environments';
import { PrimeTrustKycStep } from '../models/pt-models';
import { PrimeTrustBusinessApiSteps } from '../enums/pt-enums';
import {
  PrimeTrustBusinessUser,
  PrimeTrustBusinessUserDocument,
} from '../schemas/prime-trust-business.schema';

@Injectable()
export class PrimeTrustBusinessUserRepository {
  constructor(
    @InjectModel(PrimeTrustBusinessUser.name)
    private primeTrustBusinessUserModel: Model<PrimeTrustBusinessUserDocument>,
  ) {}

  async createPrimeTrustBaseBusinessUser(
    identity: string,
  ): Promise<PrimeTrustBusinessUser> {
    try {
      const createBaseUser = new this.primeTrustBusinessUserModel({
        identity: String(identity),
        kyc_initiated: true,
      });
      await createBaseUser.save();
      return this.getUserByIdentity(identity);
    } catch (e) {
      Logger.error('PrimeTrust Business Create User', e);
      throw new HttpException(
        'Failed to create business account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePrimeTrustBaseBusinessUser(
    identity: string,
    payload: PrimeTrustBusinessUser,
  ) {
    const user: PrimeTrustBusinessUser = {
      identity: String(identity),
      kyc_initiated: true,
    };
    user.contact_id = payload.contact_id;
    user.current_kyc_step = payload?.current_kyc_step;
    user.document_ids = payload?.document_ids;

    user.connected_banks = payload.connected_banks;
    try {
      user.account_id = encrypt(payload.account_id, PRIME_TRUST_MASTER_KEY);
      await this.primeTrustBusinessUserModel.updateOne(
        { identity },
        { ...user },
      );
    } catch (error) {
      Logger.log('Update Business Base User Error', error);
    }
  }

  async getUserByIdentity(identity: string): Promise<PrimeTrustBusinessUser> {
    return this.primeTrustBusinessUserModel
      .findOne({ identity: String(identity) })
      .exec()
      .then((user) => PrimeTrustBusinessUserRepository.mapBusinessUser(user));
  }

  async getUserCurrentStep(identity: string): Promise<PrimeTrustKycStep> {
    const userInfo = await this.getUserByIdentity(identity);
    return {
      current_kyc_step:
        userInfo && userInfo.current_kyc_step
          ? userInfo.current_kyc_step
          : PrimeTrustBusinessApiSteps.COMPANY_INFO,
    };
  }

  async updateBusinessKYCStep(identity: string): Promise<void> {
    const userInfo = await this.getUserByIdentity(identity);
    userInfo.current_kyc_step = PrimeTrustBusinessApiSteps.SUBMITTED;
    await this.updatePrimeTrustBaseBusinessUser(identity, userInfo);
  }

  private static mapBusinessUser(
    user: PrimeTrustBusinessUserDocument,
  ): PrimeTrustBusinessUser {
    if (!user) return null;
    return {
      identity: user.identity,
      account_id: user?.account_id
        ? decrypt(user?.account_id, PRIME_TRUST_MASTER_KEY)
        : null,
      contact_id: user.contact_id,
      kyc_initiated: user.kyc_initiated,
      current_kyc_step: user.current_kyc_step,
      document_ids: user.document_ids,
      wire_transfer_method_id: user.wire_transfer_method_id,
      connected_banks: user.connected_banks,
      related_contacts: user.related_contacts,
    };
  }
}
