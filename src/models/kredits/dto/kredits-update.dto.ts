import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class KreditsInfoUpdateDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;

  @IsNotEmpty()
  @IsString()
  readonly amount: string;

  @IsOptional()
  readonly referrer: string;
}
