import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KreditsInfo, KreditsInfoDocument } from './schemas/kredits.schema';
import {
  KreditsInfoLog,
  KreditsInfoLogDocument,
} from './schemas/kredits_logs.schema';
import { KreditsInfoDto } from './dto/kredits-info.dto';
import { UserProfileService } from '../user/services/user-profile.service';
import { KreditsInfoUpdateDto } from './dto/kredits-update.dto';
import { KreditsInfoUpgradeDto } from './dto/kredits-upgrade.dto';
import { KreditsInfoLogDto } from './dto/kredits-info-log.dto';
import { KredtsTiers, TxType, Denom } from './enums/enums';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from './../../environments';

@Injectable()
export class KreditsInfoService {
  constructor(
    @InjectModel(KreditsInfo.name)
    private readonly KreditsInfoModule: Model<KreditsInfoDocument>,
    private readonly userProfileService: UserProfileService,
    @InjectModel(KreditsInfoLog.name)
    private readonly KreditsInfoLogModule: Model<KreditsInfoLogDocument>,
  ) {
    sgMail.setApiKey(SENDGRID_API_KEY);
  }

  async createKreditsInfo(kreditsInfoDto: KreditsInfoDto): Promise<void> {
    const INITIAL_KREDITS = '0';
    const user = await this.userProfileService.getUserByIdentity(
      kreditsInfoDto.identity,
    );

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const kreditsInfo = await this.KreditsInfoModule.findOne({
      identity: String(kreditsInfoDto.identity),
    });

    if (!kreditsInfo) {
      try {
        const payload = {
          ...{
            identity: kreditsInfoDto.identity,
            tier: KredtsTiers.BLUE,
            kredits: INITIAL_KREDITS,
            totalKredits: INITIAL_KREDITS,
            depositKredits: INITIAL_KREDITS,
            referKredits: INITIAL_KREDITS,
            walletAddress: kreditsInfoDto.walletAddress,
            referral_code: kreditsInfoDto.referral_code,
            latest_updated_date: new Date().toISOString(),
          },
          ...(kreditsInfoDto.referrer
            ? {
                referrer: kreditsInfoDto.referrer,
                referralStatus: true,
              }
            : {}),
        };

        await this.KreditsInfoModule.create(payload);
      } catch (e) {
        Logger.error('Create Kredits Info failed', e);
        throw new HttpException(
          'Failed to create Kredit Info',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  async depositKreditsInfo(
    kreditsInfoUpdateDto: KreditsInfoUpdateDto,
  ): Promise<void> {
    const user = await this.userProfileService.getUserByIdentity(
      kreditsInfoUpdateDto.identity,
    );

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const DEPOSIT_FACTOR = 2;
    const REFERRAL_AMOUNT = 500;
    const kreditsInfo = await this.KreditsInfoModule.findOne({
      identity: kreditsInfoUpdateDto.identity,
    });

    if (!kreditsInfo) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const previousKredits = kreditsInfo.kredits;

    try {
      let totalKredits = (
        Number(kreditsInfo.totalKredits) +
        Number(kreditsInfoUpdateDto.amount) / DEPOSIT_FACTOR
      ).toString();

      const depositKredits = (
        Number(kreditsInfo.depositKredits) +
        Number(kreditsInfoUpdateDto.amount) / DEPOSIT_FACTOR
      ).toString();

      let computeKredits = (
        Number(previousKredits) +
        Number(kreditsInfoUpdateDto.amount) / DEPOSIT_FACTOR
      ).toString();

      const status = kreditsInfo.referralStatus;

      if (status) {
        computeKredits = (Number(computeKredits) + REFERRAL_AMOUNT).toString();
        totalKredits = (Number(totalKredits) + REFERRAL_AMOUNT).toString();

        const kreditsInfoOfReferrer = await this.KreditsInfoModule.findOne({
          referral_code: kreditsInfo.referrer,
        });

        const referrer_info =
          await this.userProfileService.getUserByReferralCode(
            kreditsInfo.referrer,
          );

        const referrerKredits = (
          Number(kreditsInfoOfReferrer.kredits) + REFERRAL_AMOUNT
        ).toString();

        const totalReferrerKredits = (
          Number(kreditsInfoOfReferrer.totalKredits) + REFERRAL_AMOUNT
        ).toString();

        const referKredits = (
          Number(kreditsInfoOfReferrer.referKredits) + REFERRAL_AMOUNT
        ).toString();

        try {
          await this.KreditsInfoModule.updateOne(
            {
              identity: kreditsInfoOfReferrer.identity,
            },
            {
              kredits: referrerKredits,
              totalKredits: totalReferrerKredits,
              referKredits: referKredits,
            },
            {
              upsert: true,
            },
          );

          await this.KreditsInfoModule.updateOne(
            {
              identity: kreditsInfo.identity,
            },
            {
              referralStatus: false,
            },
            {
              upsert: true,
            },
          );
        } catch (e) {
          Logger.error('Updating referral state failed', e);
          throw new HttpException(
            'Failed to update refer states',
            HttpStatus.BAD_REQUEST,
          );
        }

        // storing logs for referral
        try {
          const payload = {
            ...{
              identity: kreditsInfoUpdateDto.identity,
              txType: TxType.REFER,
              timestamp: new Date().toISOString(),
              denom: referrer_info.username,
              amount: kreditsInfoUpdateDto.amount,
              walletAddress: kreditsInfo.walletAddress,
              kredits: REFERRAL_AMOUNT.toString(),
            },
          };

          await this.KreditsInfoLogModule.create(payload);

          const userInfo = await this.userProfileService.getUserByReferralCode(
            kreditsInfo.referral_code,
          );
          const payload2 = {
            ...{
              identity: kreditsInfoOfReferrer.identity,
              txType: TxType.REFER,
              timestamp: new Date().toISOString(),
              denom: userInfo.username,
              amount: REFERRAL_AMOUNT.toString(),
              walletAddress: kreditsInfoOfReferrer.walletAddress,
              kredits: REFERRAL_AMOUNT.toString(),
            },
          };

          await this.KreditsInfoLogModule.create(payload2);

          sgMail.setApiKey(SENDGRID_API_KEY);

          await this.sendMail(referrer_info.email);
        } catch (e) {
          Logger.error('Updating deposit log failed', e);
          throw new HttpException(
            'Failed to update deposit logs',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      try {
        await this.KreditsInfoModule.updateOne(
          {
            identity: kreditsInfoUpdateDto.identity,
          },
          {
            identity: kreditsInfoUpdateDto.identity,
            tier: kreditsInfo.tier,
            kredits: computeKredits,
            totalKredits: totalKredits,
            depositKredits: depositKredits,
            latest_updated_date: new Date().toISOString(),
          },
          {
            upsert: true,
          },
        );
      } catch (e) {
        Logger.error('Create Kredits deposit Info failed', e);
        throw new HttpException(
          'Failed to create Kredit deposit Info',
          HttpStatus.BAD_REQUEST,
        );
      }

      // storing logs for deposit
      try {
        const payload = {
          ...{
            identity: kreditsInfoUpdateDto.identity,
            txType: TxType.DEPOSIT,
            timestamp: new Date().toISOString(),
            denom: Denom.aUST,
            amount: kreditsInfoUpdateDto.amount,
            walletAddress: kreditsInfo.walletAddress,
            kredits: (
              Number(kreditsInfoUpdateDto.amount) / DEPOSIT_FACTOR
            ).toString(),
          },
        };

        await this.KreditsInfoLogModule.create(payload);
      } catch (e) {
        Logger.error('Updating deposit log failed', e);
        throw new HttpException(
          'Failed to update deposit logs',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (e) {
      Logger.error('Create Kredits deposit Info failed', e);
      throw new HttpException(
        'Failed to create Kredit deposit Info',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async sendMail(email: string) {
    try {
      const msg = {
        to: email,
        from: 'contact@kash.io',
        subject: 'Kash Rewards ',
        html: '<h1>This is working <h1/>',
      };
      await sgMail.send(msg);
      console.log('Sent Email to the user');
    } catch (error) {
      console.error(error);
    }
  }

  async withdrawKreditsInfo(
    kreditsInfoUpdateDto: KreditsInfoUpdateDto,
  ): Promise<void> {
    const user = await this.userProfileService.getUserByIdentity(
      kreditsInfoUpdateDto.identity,
    );

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const WITHDRAW_FACTOR = 10;
    const kreditsInfo = await this.KreditsInfoModule.findOne({
      identity: kreditsInfoUpdateDto.identity,
    })
      .exec()
      .then();

    const previousKredits = kreditsInfo?.kredits;
    const previousTier = kreditsInfo?.tier;


    const expiredDate =new Date(kreditsInfo?.tier_expiration_date);
    const currentDate = new Date();


    const blueLimit = 5000;
    const goldLimit = 10000;
    const emeraldLimit = 20000;
    // const diamondLimit = 50000;

    try {
      const totalKredits = (
        Number(kreditsInfo.totalKredits) -
        Number(kreditsInfoUpdateDto.amount) / WITHDRAW_FACTOR
      ).toString();
      const computeTier = await this.calculateTier(Number(totalKredits));
      let computeKredits = (
        Number(previousKredits) -
        Number(kreditsInfoUpdateDto.amount) / WITHDRAW_FACTOR
      ).toString();

      if (computeTier != previousTier && currentDate>=expiredDate) {
        switch (computeTier) {
          case KredtsTiers.GOLD:
            computeKredits = (
              Number(totalKredits) - Number(blueLimit)
            ).toString();
            break;
          case KredtsTiers.EMERALD:
            computeKredits = (
              Number(totalKredits) - Number(goldLimit)
            ).toString();
            break;
          case KredtsTiers.DIAMOND:
            computeKredits = (
              Number(totalKredits) - Number(emeraldLimit)
            ).toString();
            break;
          default:
            computeKredits = Number(totalKredits).toString();
            break;
        }
      }

      await this.KreditsInfoModule.updateOne(
        {
          identity: kreditsInfoUpdateDto.identity,
        },
        {
          identity: kreditsInfoUpdateDto.identity,
          tier: computeTier,
          kredits: computeKredits,
          totalKredits: totalKredits,
          latest_updated_date: new Date().toISOString(),
        },
        {
          upsert: true,
        },
      );

      // storing logs for withdraw
      try {
        const payload = {
          ...{
            identity: kreditsInfoUpdateDto.identity,
            txType: TxType.WITHDRAW,
            timestamp: new Date().toISOString(),
            denom: Denom.UST,
            amount: kreditsInfoUpdateDto.amount,
            walletAddress: kreditsInfo.walletAddress,
            kredits: (
              Number(kreditsInfoUpdateDto.amount) / WITHDRAW_FACTOR
            ).toString(),
          },
        };

        await this.KreditsInfoLogModule.create(payload);
      } catch (e) {
        Logger.error('Updating withdraw log failed', e);
        throw new HttpException(
          'Failed to update withdraw logs',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (e) {
      Logger.error('Create Kredits deposit Info failed', e);
      throw new HttpException(
        'Failed to create Kredit deposit Info',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findKreditsInfo(identity: string): Promise<KreditsInfoDto> {
    const INITIAL_KREDITS = '0';

    const user = await this.userProfileService.getUserByIdentity(identity);

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const KreditsInfo = await this.KreditsInfoModule.findOne({
      identity: identity,
    })
      .exec()
      .then();

    if (!KreditsInfo) {
      return {
        identity: identity,
        kredits: INITIAL_KREDITS,
        totalKredits: INITIAL_KREDITS,
        depositKredits: INITIAL_KREDITS,
        referKredits: INITIAL_KREDITS,
        tier: KredtsTiers.BLUE,
        referral_code: '',
        referrer: '',
        walletAddress: '',
        tier_expiration_date : ''
      };
    }

    return {
      identity: KreditsInfo.identity,
      kredits: KreditsInfo.kredits,
      totalKredits: KreditsInfo.totalKredits,
      depositKredits: KreditsInfo.depositKredits,
      referKredits: KreditsInfo.referKredits,
      tier: KreditsInfo.tier,
      referral_code: KreditsInfo.referral_code,
      referrer: KreditsInfo.referrer,
      walletAddress: KreditsInfo.walletAddress,
      tier_expiration_date : KreditsInfo.tier_expiration_date
    };
  }

  async findKreditsInfoLog(identity: string): Promise<KreditsInfoLogDto[]> {
    const user = await this.userProfileService.getUserByIdentity(identity);

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const KreditsInfoLog = await this.KreditsInfoLogModule.find({
      identity: identity,
    })
      .sort({ timestamp: -1 })
      .exec()
      .then();

    return KreditsInfoLog;
  }

  async calculateTier(kredits: number): Promise<string> {
    const blueLimit = 5000;
    const goldLimit = 10000;
    const emeraldLimit = 20000;
    const diamondLimit = 50000;

    let tier = '';
    if (kredits <= blueLimit) {
      tier = KredtsTiers.BLUE;
    } else if (kredits > blueLimit && kredits <= goldLimit) {
      tier = KredtsTiers.GOLD;
    } else if (kredits > goldLimit && kredits <= emeraldLimit) {
      tier = KredtsTiers.EMERALD;
    } else if (kredits > emeraldLimit && kredits <= diamondLimit) {
      tier = KredtsTiers.DIAMOND;
    }

    return tier;
  }

  async upgradeTierKreditsInfo(
    KreditsInfoUpgradeDto: KreditsInfoUpgradeDto,
  ): Promise<void> {
    const user = await this.userProfileService.getUserByIdentity(
      KreditsInfoUpgradeDto.identity,
    );

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const previousTier = KreditsInfoUpgradeDto.currentTier;

    const blueLimit = 5000;
    const goldLimit = 10000;
    const emeraldLimit = 20000;
    const diamondLimit = 50000;

    try {
      const totalKredits = KreditsInfoUpgradeDto.totalKredits;
      const computeTier = await this.calculateTier(Number(totalKredits));

      const expiredDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

      let computeKredits = KreditsInfoUpgradeDto.kredits;
      if (computeTier != previousTier) {
        switch (computeTier) {
          case KredtsTiers.GOLD:
            computeKredits = (
              Number(totalKredits) - Number(blueLimit)
            ).toString();
            break;
          case KredtsTiers.EMERALD:
            computeKredits = (
              Number(totalKredits) - Number(goldLimit)
            ).toString();
            break;
          case KredtsTiers.DIAMOND:
            computeKredits = (
              Number(totalKredits) - Number(emeraldLimit)
            ).toString();
            break;
          default:
            break;
        }
      }

      await this.KreditsInfoModule.updateOne(
        {
          identity: KreditsInfoUpgradeDto.identity,
        },
        {
          identity: KreditsInfoUpgradeDto.identity,
          tier: computeTier,
          kredits: computeKredits,
          totalKredits: totalKredits,
          latest_updated_date: new Date().toISOString(),
          tier_expiration_date : expiredDate,
        },
        {
          upsert: true,
        },
      );

      return;
    } catch (e) {
      Logger.error('Create Kredits deposit Info failed', e);
      throw new HttpException(
        'Failed to create Kredit deposit Info',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
