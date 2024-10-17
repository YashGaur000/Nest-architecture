import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserInitDto } from '../dto/user-init.dto';
import { decrypt } from '../../../utils/crypto.utils';
import {
  BAANX_MASTER_KEY,
  USER_BALANCES_MASTER_KEY,
} from '../../../environments';
import {
  UserBalances,
  UserBalancesDocument,
} from '../schemas/user-balances.schema';
import moment from 'moment';
import {
  InternalUser,
  UserBalance,
  UserBalanceStatistic,
  UserPersonalInfo,
  UserReferralInfo,
} from '../common/user-interfaces';
import { UserChartRange } from '../common/user-balances.enum';
import { UserIntercomService } from './user-intercom.service';
import { UserUpdateDto } from '../dto/user-update.dto';
import { IntercomService } from './intercom.service';
import { PrimeTrustUserRepository } from '../../prime-trust-integration/repositories/prime-trust-user.repository';
import { PrimeTrustCommonService } from 'src/models/prime-trust-integration/services/prime-trust-common.service';
import { PrimeTrustApiSteps } from 'src/models/prime-trust-integration/enums/pt-enums';
import {
  INTERCOM_PRIME_TRUST_EXCHANGE,
  INTERCOM_USER_BLOCKED_TAG_ID,
} from '../config/user.config';
import { UserAccessControl } from '../common/enums';
import { generateReferralCode } from '../../kredits/utils/generate-referral-code';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserBalances.name)
    private readonly userBalancesModel: Model<UserBalancesDocument>,
    private readonly userIntercomService: UserIntercomService,
    private readonly intercomService: IntercomService,
    private readonly primeTrustUserRepository: PrimeTrustUserRepository,
    private readonly primeTrustIntercomService: PrimeTrustCommonService,
  ) {}

  async getUserByIdentity(identity: string): Promise<InternalUser> {
    const user = await this.userModel
      .findOne({ identity: String(identity) })
      .exec()
      .then((user) => {
        if (!user) {
          return null;
        }
        const baanx_external_id = user?.baanx_external_id
          ? decrypt(user.baanx_external_id, BAANX_MASTER_KEY)
          : null;
        return {
          identity: user.identity,
          terra_wallet_address: user.terra_wallet_address,
          ethereum_wallet_address: user.ethereum_wallet_address,
          intercome_id: user.intercome_id,
          referral_code: user.referral_code,
          last_logged_in: user.last_logged_in,
          baanx_external_id,
        };
      });

    if (!user) {
      return null;
    }

    const isUserBlocked = await this.userIntercomService
      .getUserByIdAndTagId(user?.intercome_id, INTERCOM_USER_BLOCKED_TAG_ID)
      .then((data) => Boolean(data))
      .catch(() => false);

    return { ...user, isUserBlocked };
  }

  async checkUserByIdentity(identity: string): Promise<User> {
    const user = await this.getUserByIdentity(identity);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user?.isUserBlocked) {
      throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return user;
  }

  getUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async getUserByReferralCode(
    referral_code: string,
  ): Promise<UserReferralInfo> {
    let com_id: string;
    this.userModel
      .findOne({ referral_code: String(referral_code) })
      .exec()
      .then((user) => {
        if (!user) {
          return null;
        }
      });

    const intercomUser = await this.userIntercomService.getUserById(com_id);
    return {
      username: intercomUser?.name || 'user',
      referral_code: referral_code,
      user_id: com_id || '1',
      email: intercomUser?.email || 'user@kash.io',
    };
  }

  async getUserPersonalInfo(identity: string): Promise<UserPersonalInfo> {
    const user = await this.getUserByIdentity(identity);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.isUserBlocked) {
      throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    let intercomUser = await this.userIntercomService.getUserById(
      user.intercome_id,
    );

    if (!intercomUser) {
      intercomUser = {};
      Logger.log('User not found in intercome');
    }

    const accessControl = [];
    const tags = intercomUser?.tags?.data || [];

    // Check access for Prime Trust exchange
    if (tags && tags.find((tag) => tag.id === INTERCOM_PRIME_TRUST_EXCHANGE)) {
      accessControl.push(UserAccessControl.PRIME_TRUST_EXCHANGE);
    }

    const primeTrustData =
      await this.primeTrustUserRepository.getUserByIdentity(identity);

    if (
      primeTrustData &&
      primeTrustData.current_kyc_step &&
      primeTrustData.current_kyc_step === PrimeTrustApiSteps.SUBMITTED
    ) {
      primeTrustData.current_kyc_step = await this.primeTrustIntercomService
        .intercomPTStatus(primeTrustData.account_id)
        .catch(() => null);
    }
    return {
      name: intercomUser?.name,
      location: intercomUser?.location,
      phone: intercomUser?.phone,
      address: intercomUser?.custom_attributes?.address || null,
      ssn: intercomUser?.custom_attributes?.ssn || null,
      accessControl,
      primeTrust: primeTrustData
        ? {
            currentKycStep: primeTrustData.current_kyc_step,
            kycInitiated: primeTrustData.kyc_initiated,
          }
        : null,
    };
  }

  async updateUserPersonalInfo(identity: string, payload: UserUpdateDto) {
    const user = await this.getUserByIdentity(identity);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user?.isUserBlocked) {
      throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const intercomeUser = await this.userIntercomService.getUserById(
      user.intercome_id,
    );

    if (!intercomeUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    try {
      await this.intercomService.updateContacts(user.intercome_id, payload);
    } catch (e) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }
  }

  async initUser(userInitDto: UserInitDto): Promise<any> {
    const existingUser = await this.getUserByIdentity(userInitDto.identity);
    let intercomUser = await this.userIntercomService.getUserByEmail(
      userInitDto.email,
    );

    if (!intercomUser) {
      intercomUser = { id: null };
      Logger.log('User not found in intercome');
    }

    let payload;

    const referral_code = generateReferralCode();

    if (existingUser) {
      payload = {
        intercome_id: intercomUser?.id,
        last_logged_in: new Date().toISOString(),
      };

      if (!existingUser.referral_code) {
        payload['referral_code'] = referral_code;
      }
    } else {
      payload = {
        identity: userInitDto.identity,
        intercome_id: intercomUser?.id,
        terra_wallet_address: userInitDto.terra,
        ethereum_wallet_address: userInitDto.ethereum,
        referral_code: referral_code,
        last_logged_in: new Date().toISOString(),
      };
    }

    await this.userModel.updateOne(
      { identity: String(userInitDto.identity) },
      payload,
      {
        upsert: true,
      },
    );
  }

  async getUserBalances(
    identity: string,
    range: UserChartRange,
  ): Promise<UserBalanceStatistic[]> {
    const user = await this.getUserByIdentity(identity);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user?.isUserBlocked) {
      throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const dateRange = this.getDateRangeByUserChartResource(range);
    if (!dateRange) {
      throw new HttpException('Invalid range', HttpStatus.BAD_REQUEST);
    }
    const userBalances = await this.userBalancesModel.aggregate([
      {
        $addFields: {
          created_date: {
            $dateFromString: {
              dateString: '$created_date',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
        },
      },
      {
        $match: {
          identity: {
            $eq: identity,
          },
          created_date: {
            $gte: dateRange.$gte,
            $lt: dateRange.$lt,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_date' },
            month: { $month: '$created_date' },
            day: { $dayOfMonth: '$created_date' },
          },
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { created_date: 1 } },
    ]);

    return userBalances.map((item) => {
      const balance: UserBalance[] = JSON.parse(
        decrypt(item.balances, USER_BALANCES_MASTER_KEY),
      );

      return {
        balances: balance,
        date: item.created_date,
      };
    });
  }

  private getDateRangeByUserChartResource(userChartRange: UserChartRange): {
    $gte: Date;
    $lt: Date;
  } {
    const currentDate = new Date();
    switch (userChartRange) {
      case UserChartRange.WEEK:
        return {
          $gte: moment(currentDate).subtract(7, 'days').endOf('day').toDate(),
          $lt: moment(currentDate).endOf('day').toDate(),
        };
      case UserChartRange.MONTH:
        return {
          $gte: moment(currentDate).subtract(1, 'month').endOf('day').toDate(),
          $lt: moment(currentDate).endOf('day').toDate(),
        };
      case UserChartRange.HALF_YEAR:
        return {
          $gte: moment(currentDate).subtract(6, 'months').endOf('day').toDate(),
          $lt: moment(currentDate).endOf('day').toDate(),
        };
      case UserChartRange.YEAR:
        return {
          $gte: moment(currentDate).subtract(1, 'years').endOf('day').toDate(),
          $lt: moment(currentDate).endOf('day').toDate(),
        };
      // case UserChartRange.YEAR_TO_DATE:
      //   return {
      //     $gte: moment(currentDate).endOf('year').toDate(),
      //     $lt: moment(currentDate).endOf('day').toDate(),
      //   };
      default:
        return null;
    }
  }
}
