import { IsNotEmpty, IsString } from 'class-validator';

export class KreditsInfoGetDto {
  @IsNotEmpty()
  @IsString()
  readonly identity: string;
}
