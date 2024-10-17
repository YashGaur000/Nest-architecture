import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class KreditsInfoDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;

  @IsString()
  @IsOptional()
  readonly kredits: string;

  @IsString()
  @IsOptional()
  readonly totalKredits: string;

  @IsString()
  @IsOptional()
  readonly depositKredits: string;

  @IsString()
  @IsOptional()
  readonly referKredits: string;

  @IsString()
  @IsOptional()
  readonly tier: string;

  @IsString()
  @IsOptional()
  readonly referral_code: string;

  @IsString()
  @IsOptional()
  readonly referrer: string;

  @IsString()
  @IsOptional()
  readonly walletAddress: string;

  @IsString()
  @IsOptional()
  readonly tier_expiration_date: string;
}
