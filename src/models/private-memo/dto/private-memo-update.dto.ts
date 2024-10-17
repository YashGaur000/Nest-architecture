import { IsNotEmpty, IsString } from 'class-validator';

export class PrivateMemoUpdateDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;
  @IsNotEmpty()
  readonly memo: string;
  @IsNotEmpty()
  readonly th_hash: string;
}
