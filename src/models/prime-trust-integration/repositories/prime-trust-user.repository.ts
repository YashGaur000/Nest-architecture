import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decrypt, encrypt } from '../../../utils/crypto.utils';
import { BAANX_MASTER_KEY } from '../../../environments';
import {
  PrimeTrustUser,
  PrimeTrustUserDocument,
} from '../schemas/prime-trust-user.schema';
import { PrimeTrustKycStep } from '../models/pt-models';
import { PrimeTrustApiSteps } from '../enums/pt-enums';

@Injectable()
export class PrimeTrustUserRepository {
  constructor(
    @InjectModel(PrimeTrustUser.name)
    private primeTrustUserModel: Model<PrimeTrustUserDocument>,
  ) {}

  async createPrimeTrustBaseUser(identity: string): Promise<PrimeTrustUser> {
    try {
      const createBaseUser = new this.primeTrustUserModel({
        identity: String(identity),
        kyc_initiated: true,
      });
      await createBaseUser.save();
      return this.getUserByIdentity(identity);
    } catch (e) {
      Logger.error('PrimeTrust create User', e);
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePrimeTrustBaseUser(identity: string, payload: PrimeTrustUser) {
    const user: PrimeTrustUser = {
      identity: String(identity),
      kyc_initiated: true,
    };
    user.contact_id = payload.contact_id;
    user.current_kyc_step = payload?.current_kyc_step;
    user.card_object_id = payload?.card_object_id;
    user.card_verification_id = payload?.card_verification_id;
    user.card_status = payload?.card_status;
    user.card_id = payload?.card_id;
    user.document_ids = payload?.document_ids;
    user.proof_of_address = payload?.proof_of_address;
    user.push_transfer_method_id = payload?.push_transfer_method_id;
    user.asset_transfer_info = payload?.asset_transfer_info;
    user.wire_transfer_method_id = payload?.wire_transfer_method_id;
    user.connected_banks = payload.connected_banks;
    try {
      user.account_id = encrypt(payload.account_id, BAANX_MASTER_KEY);
      await this.primeTrustUserModel.updateOne({ identity }, { ...user });
    } catch (error) {
      Logger.error('Update Base User Error', error);
    }
  }

  async getUserByIdentity(identity: string): Promise<PrimeTrustUser> {
    return this.primeTrustUserModel
      .findOne({ identity: String(identity) })
      .exec()
      .then((user) => PrimeTrustUserRepository.mapUser(user));
  }

  async getUserCurrentStep(identity: string): Promise<PrimeTrustKycStep> {
    const userInfo = await this.getUserByIdentity(identity);
    return {
      current_kyc_step:
        userInfo && userInfo.current_kyc_step
          ? userInfo.current_kyc_step
          : PrimeTrustApiSteps.ADDRESS,
    };
  }

  private static mapUser(user: PrimeTrustUserDocument): PrimeTrustUser {
    if (!user) return null;
    return {
      identity: user.identity,
      account_id: user?.account_id
        ? decrypt(user?.account_id, BAANX_MASTER_KEY)
        : null,
      contact_id: user.contact_id,
      kyc_initiated: user.kyc_initiated,
      current_kyc_step: user.current_kyc_step,
      document_ids: user.document_ids,
      proof_of_address: user.proof_of_address,
      push_transfer_method_id: user.push_transfer_method_id,
      wire_transfer_method_id: user.wire_transfer_method_id,
      connected_banks: user.connected_banks,
      asset_transfer_info: user.asset_transfer_info,
    };
  }
}
