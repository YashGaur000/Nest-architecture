import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserWhitelistDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
