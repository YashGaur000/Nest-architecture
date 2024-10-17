import { ApiProperty } from '@nestjs/swagger';

export interface CreateAccountInput {
  type: string; // 'CHECKING_PERSONAL'
  purpose: string;
}

export interface CreateAccountResponse {
  id: string;
  iban: string;
  bic: string;
  type: string; // 'CHECKING_PERSONAL'
  balance: {
    value: number;
    unit: string; // 'cents'
    currency: string; // 'EUR'
  };
  available_balance: {
    value: number;
    unit: string; // 'cents'
    currency: string; // 'EUR'
  };
  locking_status: string; // 'NO_BLOCK'
  locking_reasons: [];
  account_limit: {
    value: number;
    unit: string; // 'cents'
    currency: string; // 'EUR'
  };
  currency: string; //  'EUR'
  purpose: string;
  person_id: string;
}

export interface GetAccountResponse {
  id: string;
  iban: string;
  bic: string;
  type: string; // 'CHECKING_PERSONAL'
  balance: {
    value: number;
    unit: string; // 'cents'
    currency: string; // 'EUR'
  };
  available_balance: {
    value: number;
    unit: string; // 'cents'
    currency: string; // 'EUR'
  };
  locking_status: string; // 'NO_BLOCK'
  locking_reasons: [];
  account_limit: {
    value: number;
    unit: string; // 'cents'
    currency: string; // 'EUR'
  };
  currency: string; //  'EUR'
  purpose: string;
  person_id: string;
}

export class SolarisAccountBalance {
  @ApiProperty()
  value: number;
  @ApiProperty()
  unit: string; // 'cents'
  @ApiProperty()
  currency: string; // 'EUR'
}

export class SolarisAccount {
  @ApiProperty()
  iban: string;

  @ApiProperty()
  bic: string;

  @ApiProperty({ type: () => SolarisAccountBalance })
  balance: SolarisAccountBalance;

  @ApiProperty({ type: () => SolarisAccountBalance })
  available_balance: SolarisAccountBalance;
}
