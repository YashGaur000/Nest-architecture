import {
  CardLostReasonEnum,
  CardStatusEnum,
  CardTypeEnum,
} from '../enums/cards.enums';
import { ApiProperty } from '@nestjs/swagger';

export interface CreateCardInput {
  type: CardTypeEnum;
  pin?: string;
  line_1: string;
  reference: string;
}

export interface ActivateCardInput {
  verification_token?: string;
}

export interface LostCardInput {
  loss_reason: CardLostReasonEnum;
  lost_at: string;
  order_replacement: boolean;
  retain_pin: boolean;
}

export interface CreateCardResponse {
  id: string;
  status: CardStatusEnum;
}

export interface GetCardResponse {
  id: string;
  type: CardTypeEnum;
  status: CardStatusEnum;
  expiration_date: string;
  person_id: string;
  account_id: string;
  representation: CardRepresentation;
}

export interface CardRepresentation {
  line_1: string;
  masked_pan: string;
  formatted_expiration_date: string;
}

export class SolarisCardRepresentation {
  @ApiProperty()
  line_1: string;

  @ApiProperty()
  masked_pan: string;

  @ApiProperty()
  formatted_expiration_date: string;
}

export class SolarisCard {
  @ApiProperty()
  id?: string;

  @ApiProperty({ enum: CardTypeEnum })
  type: CardTypeEnum;

  @ApiProperty({ enum: CardStatusEnum })
  status: CardStatusEnum;

  @ApiProperty()
  expiration_date?: string;

  @ApiProperty({ type: () => SolarisCardRepresentation })
  representation?: SolarisCardRepresentation;
}
