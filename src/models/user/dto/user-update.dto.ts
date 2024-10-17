import { IsNotEmpty, IsString } from 'class-validator';

export class UserUpdateDto {
  @IsNotEmpty()
  @IsString()
  identity: string;

  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  ssn?: string;
}
