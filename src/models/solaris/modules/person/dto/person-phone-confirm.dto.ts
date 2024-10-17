import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PersonPhoneConfirmDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  token: string;
}
