import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decrypt, encrypt } from '../../../utils/crypto.utils';
import { BAANX_MASTER_KEY } from '../../../environments';
import { BaanxUser, BaanxUserDocument } from '../schemas/baanx-user.schema';
import { BaanxUserUpdateDto } from '../dto/baanx-user.dto';
import { BaanxCurrency } from '../common/enums';

@Injectable()
export class BaanxUserRepository {
  constructor(
    @InjectModel(BaanxUser.name)
    private baanxUserModel: Model<BaanxUserDocument>,
  ) {}

  private static mapUser(user): BaanxUser {
    if (!user) {
      return null;
    }
    const external_id = user?.external_id
      ? decrypt(user?.external_id, BAANX_MASTER_KEY)
      : null;
    const reference_code = user?.reference_code
      ? decrypt(user?.reference_code, BAANX_MASTER_KEY)
      : null;
    return {
      identity: user.identity,
      kyc_request_id: user?.kyc_request_id,
      kyc_status: user?.kyc_status,
      user_pass_kyc: user?.user_pass_kyc,
      external_id,
    };
  }

  async createBaseUser(
    identity: string,
    externalID: string,
  ): Promise<BaanxUser> {
    try {
      const createBaseUser = new this.baanxUserModel({
        identity,
        external_id: encrypt(externalID, BAANX_MASTER_KEY),
      });

      await createBaseUser.save();
      return this.getUserByIdentity(identity);
    } catch (e) {
      Logger.error('Baanx createBaseUser', e);
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserByIdentity(identity: string): Promise<BaanxUser> {
    return this.baanxUserModel
      .findOne({ identity })
      .exec()
      .then((user) => BaanxUserRepository.mapUser(user));
  }

  async updateUser(
    identity: string,
    payload: BaanxUserUpdateDto,
  ): Promise<void> {
    await this.baanxUserModel.updateOne(
      { identity },
      {
        ...payload,
      },
    );
  }

  async getUserByKycRequestId(requestId: string): Promise<BaanxUser> {
    return this.baanxUserModel
      .findOne({ kyc_request_id: requestId })
      .exec()
      .then((user) => BaanxUserRepository.mapUser(user));
  }
}
