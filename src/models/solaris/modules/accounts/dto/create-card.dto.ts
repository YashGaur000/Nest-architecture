import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CardTypeEnum } from '../enums/cards.enums';

export class CreateCardDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  pin: string;

  @IsNotEmpty()
  @IsEnum(CardTypeEnum)
  @ApiProperty({ enum: CardTypeEnum })
  type: CardTypeEnum;
}
