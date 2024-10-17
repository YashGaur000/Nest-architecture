import { IsNotEmpty, IsString } from 'class-validator';

export class UserUpdateContactDto {
  @IsNotEmpty()
  @IsString()
  identity: string;

  @IsNotEmpty()
  contactId: string;

  @IsNotEmpty()
  name: string;

  email: string;

  iban?: string;

  walletAddress?: string[];

  phoneNumbers: string[];
}
