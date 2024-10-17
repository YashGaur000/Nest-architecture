import { IsNotEmpty, IsString } from 'class-validator';

export class PrivateMemoGetDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;
  @IsNotEmpty()
  readonly th_hash: string;
}
