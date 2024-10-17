import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CardLostReasonEnum } from '../enums/cards.enums';

export class LostCardDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  card_id: string;

  @IsEnum(CardLostReasonEnum)
  @ApiProperty({ enum: CardLostReasonEnum })
  loss_reason: CardLostReasonEnum;
}
