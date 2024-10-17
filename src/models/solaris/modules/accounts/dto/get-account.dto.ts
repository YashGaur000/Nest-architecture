import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAccountDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;
}
