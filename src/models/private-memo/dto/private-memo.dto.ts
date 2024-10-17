import { IsNotEmpty, IsString } from 'class-validator';

export class PrivateMemoDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;
  @IsNotEmpty()
  readonly memo: string;
  @IsNotEmpty()
  readonly th_hash: string;
  @IsNotEmpty()
  readonly tx_type: string;
}
