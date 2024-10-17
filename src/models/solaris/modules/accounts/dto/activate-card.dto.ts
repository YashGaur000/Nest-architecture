import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateCardDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  card_id: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    required: false,
    description: 'Required only if card type equal MASTERCARD_DEBIT',
  })
  verification_token?: string;
}
