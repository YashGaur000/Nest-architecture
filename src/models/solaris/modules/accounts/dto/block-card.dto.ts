import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockCardDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  card_id: string;
}
