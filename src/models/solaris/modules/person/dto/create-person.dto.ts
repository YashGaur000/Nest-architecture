import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PersonEmploymentStatusEnum,
  PersonMaritalStatusEnum,
  PersonSalutationEnum,
  PersonTaxReasonNoTin,
} from '../enums/person.enums';
import { CardTypeEnum } from '../../accounts/enums/cards.enums';

export class CreatePersonAddressDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  line_1: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  line_2: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  postal_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  country: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  state: string;
}

export class CreatePersonDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @ApiProperty({ enum: CardTypeEnum })
  @IsEnum(CardTypeEnum)
  card_plan: CardTypeEnum;

  @IsNotEmpty()
  @ApiProperty({ enum: PersonSalutationEnum })
  @IsEnum(PersonSalutationEnum)
  salutation: PersonSalutationEnum;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  first_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  last_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  birth_date: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  birth_city: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  birth_country: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  nationality: string;

  @IsNotEmpty()
  @ApiProperty({ type: () => CreatePersonAddressDto })
  @ValidateNested()
  address: CreatePersonAddressDto;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  mobile_number: string;

  @IsNotEmpty()
  @ApiProperty({ enum: PersonEmploymentStatusEnum })
  @IsEnum(PersonEmploymentStatusEnum)
  employment_status: PersonEmploymentStatusEnum;

  @IsNotEmpty()
  @ApiProperty({ enum: PersonMaritalStatusEnum })
  @IsEnum(PersonMaritalStatusEnum)
  marital_status: PersonMaritalStatusEnum;

  @IsNotEmpty()
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  fatca_relevant: boolean;

  @IsNotEmpty()
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  fatca_crs_confirmed_at: boolean;

  @IsNotEmpty()
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  terms_conditions_signed_at: boolean;

  @IsNotEmpty()
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  own_economic_interest_signed_at: boolean;

  @ApiProperty({ type: String })
  tax_identification?: string;

  @IsEnum(PersonTaxReasonNoTin)
  @ApiProperty({ enum: PersonTaxReasonNoTin })
  reason_no_tin?: PersonTaxReasonNoTin;

  @ApiProperty({ type: String })
  reason_description?: string;
}
