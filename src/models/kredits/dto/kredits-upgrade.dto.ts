import { IsNotEmpty, IsString } from 'class-validator';

export class KreditsInfoUpgradeDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;

  @IsNotEmpty()
  @IsString()
  readonly totalKredits: string;

  @IsNotEmpty()
  @IsString()
  readonly kredits: string;

  @IsNotEmpty()
  @IsString()
  readonly currentTier: string;
}
