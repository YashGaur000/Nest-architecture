import { IsNotEmpty } from 'class-validator';

export class CreateTxLogDto {
  @IsNotEmpty()
  readonly identity: string;

  readonly amount: string;
  readonly asset: string;
  readonly type: string;
  readonly network: string;
  readonly tx_fee: string;
  readonly tx_kash_fee: string;
  readonly tx_fee_denom: string;
}
