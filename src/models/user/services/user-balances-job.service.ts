import { Injectable, Logger } from '@nestjs/common';
import { AccountBalancesService } from './account-balances-service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserProfileService } from './user-profile.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserBalances,
  UserBalancesDocument,
} from '../schemas/user-balances.schema';
import { encrypt } from '../../../utils/crypto.utils';
import { USER_BALANCES_MASTER_KEY } from '../../../environments';
import Bottleneck from 'bottleneck';
import { UserBalance } from '../common/user-interfaces';
import { SKIP_JOB_RUN_TOTAL_BALANCE } from '../config/user.config';

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500,
});

@Injectable()
export class UserBalancesJobService {
  private readonly logger = new Logger('Users balances job');

  constructor(
    private readonly accountBalancesService: AccountBalancesService,
    private readonly userProfileService: UserProfileService,
    @InjectModel(UserBalances.name)
    private userBalancesModel: Model<UserBalancesDocument>,
  ) {}

  private static mapBalances(
    assetsBalances: UserBalance[],
    terraBalances: UserBalance[],
    ethBalances: UserBalance[],
    usdBalances: UserBalance,
  ): UserBalance[] {
    const balances: UserBalance[] = [];

    if (assetsBalances?.length) {
      balances.push(...assetsBalances);
    }

    if (terraBalances && terraBalances.length) {
      balances.push(...terraBalances);
    }

    if (ethBalances?.length) {
      balances.push(...ethBalances);
    }

    if (usdBalances) {
      balances.push(usdBalances);
    }

    return balances.filter((item) => !!item);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    if (SKIP_JOB_RUN_TOTAL_BALANCE) {
      this.logger.debug(`Skip TOTAL BALANCE JOB for this ENV`);
      return;
    }
    this.logger.debug(
      `Store user balances job start in ${new Date().toISOString()}`,
    );
    const users = await this.userProfileService.getUsers();

    this.logger.debug(`Found total users ${users.length}`);
    for (const user of users) {
      try {
        await limiter.schedule(() => this.saveBalances(user));
      } catch (e) {
        Logger.error(
          `Store user balances failed for user with identity ${user.identity}`,
          e,
        );
      }
    }

    this.logger.debug(
      `Store user balances job finish in ${new Date().toISOString()}`,
    );
  }

  private async saveBalances(user): Promise<void> {
    let assetsBalances: UserBalance[] = [];
    let terraBalances: UserBalance[] = [];
    let ethBalances: UserBalance[] = [];
    let usdBalances: UserBalance = null;

    if (user.terra_wallet_address) {
      assetsBalances = await this.accountBalancesService.getAssetsBalances(
        user.terra_wallet_address,
      );
      terraBalances = await this.accountBalancesService.getTerraBalances(
        user.terra_wallet_address,
      );
    }

    if (user.ethereum_wallet_address) {
      ethBalances = await this.accountBalancesService.getEthereumBalances(
        user.ethereum_wallet_address,
      );
    }

    if (user.identity) {
      usdBalances = await this.accountBalancesService.getUsdBalance(
        user.identity,
      );
    }

    const balances = UserBalancesJobService.mapBalances(
      assetsBalances,
      terraBalances,
      ethBalances,
      usdBalances,
    );

    const userBalances = new this.userBalancesModel({
      identity: user.identity,
      balances: encrypt(JSON.stringify(balances), USER_BALANCES_MASTER_KEY),
      created_date: new Date().toISOString(),
    } as UserBalances);
    await userBalances.save();
  }
}
