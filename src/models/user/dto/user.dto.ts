import { IsNotEmpty, IsString } from 'class-validator';
import { UserChartRange } from '../common/user-balances.enum';

export class UserIdentityDto {
  @IsNotEmpty()
  @IsString()
  identity: string;
}


export class UserEmailDto {
  @IsNotEmpty()
  email: string;
}

// export class UserReferralDto {
//   @IsNotEmpty()
//   username: string;
//   @IsNotEmpty()
//   referral_code: string;
//   @IsNotEmpty()
//   user_id: string;
// }

export class UserBalanceStatisticsDto {
  @IsNotEmpty()
  @IsString()
  identity: string;

  @IsNotEmpty()
  range: UserChartRange;
}

export class UserGetContact {
  @IsNotEmpty()
  @IsString()
  identity: string;

  @IsNotEmpty()
  contactId: string;
}
