import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decrypt, encrypt } from '../../../utils/crypto.utils';
import { BAANX_MASTER_KEY } from '../../../environments';
import { WyreUser, WyreUserDocument } from '../schemas/wyre-user.schema';

@Injectable()
export class WyreUserRepository {
  constructor(
    @InjectModel(WyreUser.name)
    private wyreUserModel: Model<WyreUserDocument>,
  ) {}

  private static mapUser(user): WyreUser {
    if (!user) {
      return null;
    }
    const secret_key = user?.secret_key
      ? decrypt(user?.secret_key, BAANX_MASTER_KEY)
      : null;
    const account_id = user?.account_id;
    // ? decrypt(user?.account_id, BAANX_MASTER_KEY)
    // : null;
    return {
      identity: user.identity,
      secret_key: secret_key,
      account_id: account_id,
      current_kyc_step: user.current_kyc_step,
    };
  }

  async createBaseUser(identity: string, secretKey: string): Promise<WyreUser> {
    try {
      const createWyreUser = new this.wyreUserModel({
        identity,
        secret_key: encrypt(secretKey, BAANX_MASTER_KEY),
      });

      await createWyreUser.save();
      return this.getUserByIdentity(identity);
    } catch (e) {
      Logger.error('Wyre createWyreUser', e);
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateBaseUser(identity: string, payload: WyreUser) {
    payload.secret_key = encrypt(payload.secret_key, BAANX_MASTER_KEY);
    try {
      await this.wyreUserModel.updateOne({ identity }, { ...payload });
      console.log('Finsihed update');
    } catch (error) {
      console.log('Update Base USer error', error);
    }
  }

  async getUserByIdentity(identity: string): Promise<WyreUser> {
    return this.wyreUserModel
      .findOne({ identity })
      .exec()
      .then((user) => WyreUserRepository.mapUser(user));
  }

  async getUserCurrentStep(identity: string) {
    const userInfo = await this.getUserByIdentity(identity);
    return {
      account_id: userInfo.account_id,
      current_kyc_step: userInfo.current_kyc_step,
    };
  }
}
