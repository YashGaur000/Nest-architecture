import { UserBalanceType } from './user-balances.enum';
import { UserAccessControl } from './enums';
import { Prop } from '@nestjs/mongoose';

export interface UserBalanceStatistic {
  date: Date;
  balances: UserBalance[];
}

export interface AssetsBalance {
  token: string;
  balance: string;
}

export interface TerraBalance {
  aUSTBalance: {
    balance: string;
  };
  exchangeRate: {
    aterra_supply: string;
    exchange_rate: string;
  };
  bankBalances: {
    balance: string;
    denom: string;
  }[];
}

export interface MarketSwapRate {
  denom: string;
  swaprate: string;
  oneDayVariation: string;
  oneDayVariationRate: string;
}

export interface EthereumBalance {
  denom: string;
  balance: string;
}

export interface UserBalance {
  denom: string;
  balance: string;
  type: UserBalanceType;
}

export interface UserPersonalInfo {
  name: string;
  location: UserIntercomLocation;
  primeTrust?: UserPrimeTrust;
  phone?: string;
  address?: string;
  ssn?: string;
  accessControl?: UserAccessControl[];
}

export interface UserReferralInfo {
  username: string;
  referral_code: string;
  user_id: string;
  email: string;
}

export interface InternalUser {
  identity: string;
  terra_wallet_address: string;
  ethereum_wallet_address: string;
  baanx_external_id?: string;
  intercome_id: string;
  referral_code: string;
  last_logged_in?: string;
  isUserBlocked?: boolean;
}

export interface UserIntercomLocation {
  type: string;
  country: string;
  region: string;
  city: string;
}

export interface UserPrimeTrust {
  kycInitiated: boolean;
  currentKycStep: string;
}

export interface InvestmentRestrictions {
  investmentRestrictions: boolean;
}

export interface UserContact {
  id: string;
  name: string;
  email: string;
  iban?: string;
  walletAddress?: string[];
  phoneNumbers?: string[];
}
