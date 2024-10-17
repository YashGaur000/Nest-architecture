import { IsString } from 'class-validator';

export class KreditsInfoLogDto {
  @IsString()
  readonly txType: string;

  @IsString()
  readonly kredits: string;

  @IsString()
  readonly amount: string;

  @IsString()
  readonly walletAddress: string;

  @IsString()
  readonly timestamp: string;

  @IsString()
  readonly denom: string;
}
