import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UserInitDto {
  @IsNotEmpty()
  @IsString()
  identity: string;

  @IsNotEmpty()
  @Length(44, 44)
  terra: string;

  @IsNotEmpty()
  ethereum: string;

  @IsNotEmpty()
  email: string;
}
