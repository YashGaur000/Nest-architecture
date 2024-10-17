import { IsNotEmpty, IsString } from 'class-validator';

export class UserCreateContactDto {
  @IsNotEmpty()
  @IsString()
  identity: string;

  @IsNotEmpty()
  name: string;

  email: string;

  iban?: string;

  walletAddress?: string[];

  phoneNumbers: string[];
}
