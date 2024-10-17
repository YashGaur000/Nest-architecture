import { IsEmail, IsNotEmpty } from 'class-validator';

export class TwoFASendDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}

export class TwoFAVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  readonly code: string;
}
