import {
  PersonEmploymentStatusEnum,
  PersonIdentificationFinal,
  PersonIdentificationRequestAction,
  PersonIdentificationStatus,
  PersonMaritalStatusEnum,
  PersonSalutationEnum,
  PersonTaxReasonNoTin,
} from '../enums/person.enums';
import { SolarisPersonIdentification } from '../schemas/person-identification.schema';
import { ApiProperty } from '@nestjs/swagger';
import { SolarisPersonDevice } from '../schemas/person-device.schema';
import { CardTypeEnum } from '../../accounts/enums/cards.enums';

export interface SolarisAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SolarisCreatePersonInput {
  salutation: PersonSalutationEnum;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_city: string;
  birth_country: string;
  email: string;
  nationality: string;
  address: {
    line_1: string;
    line_2: string;
    postal_code: string;
    city: string;
    country: string;
    state: string;
  };
  mobile_number: string;
  employment_status: PersonEmploymentStatusEnum;
  tax_information: {
    marital_status: PersonMaritalStatusEnum;
  };
  fatca_relevant: boolean;
  fatca_crs_confirmed_at: string;
  terms_conditions_signed_at: string;
  own_economic_interest_signed_at: string;
}

export interface UpdateSolarisPerson {
  account_id?: string;
  tax_identification?: string;
  account_approved?: boolean;
  identifications?: SolarisPersonIdentification;
  device?: SolarisPersonDevice;
}

export class SolarisInternalPersonDevice {
  @ApiProperty()
  restricted_key_verified?: boolean;

  @ApiProperty()
  unrestricted_key_verified?: boolean;
}

export class SolarisInternalPersonIdentification {
  @ApiProperty({ enum: PersonIdentificationStatus })
  status: PersonIdentificationStatus;

  @ApiProperty({ enum: PersonIdentificationFinal })
  final: PersonIdentificationFinal;

  @ApiProperty({ enum: PersonIdentificationRequestAction })
  required_action: PersonIdentificationRequestAction;

  @ApiProperty()
  description: string;
}

export class SolarisPerson {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  mobile_number: string;

  @ApiProperty()
  account_approved: boolean;

  @ApiProperty({ enum: CardTypeEnum })
  pre_order_card_type: CardTypeEnum;

  @ApiProperty({ type: () => SolarisInternalPersonDevice })
  device: SolarisInternalPersonDevice;

  @ApiProperty({ type: () => SolarisInternalPersonIdentification })
  identification: SolarisInternalPersonIdentification;
}

export interface SolarisUpdatePersonInput {
  salutation?: PersonSalutationEnum;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_city?: string;
  birth_country?: string;
  email?: string;
  nationality?: string;
  address: {
    line_1?: string;
    line_2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    state?: string;
  };
  mobile_number?: string;
  employment_status?: PersonEmploymentStatusEnum;
  tax_information: {
    marital_status?: PersonMaritalStatusEnum;
  };
}

export interface SolarisExternalPerson {
  id: string;
  salutation: PersonSalutationEnum;
  title: string;
  first_name: string;
  last_name: string;
  address: {
    line_1: string;
    line_2: string;
    postal_code: string;
    city: string;
    country: string;
    state: string;
  };
  contact_address: {
    line_1: string;
    line_2: string;
    postal_code: string;
    city: string;
    country: string;
    state: string;
  };
  email: string;
  mobile_number: string;
  birth_name: string;
  birth_date: string;
  birth_city: string;
  birth_country: string;
  nationality: string;
  employment_status: PersonEmploymentStatusEnum;
  job_title: string;
  tax_information: {
    tax_assessment: string; // NONE, SEPARATE, JOINT
    marital_status: PersonMaritalStatusEnum;
  };
  fatca_relevant: boolean;
  fatca_crs_confirmed_at: string;
  business_purpose: string;
  industry: string;
  industry_key: string;
  terms_conditions_signed_at: string;
  own_economic_interest_signed_at: string;
  expected_monthly_revenue_cents: number;
  vat_number: string;
  website_social_media: string;
  business_trading_name: string;
  nace_code: string;
  business_address_line_1: string;
  business_address_line_2: string;
  business_postal_code: string;
  business_city: string;
  business_country: string;
}

export interface SolarisCreatePersonTaxIdentificationInput {
  number: string;
  country: string;
  primary: boolean;
  reason_no_tin?: PersonTaxReasonNoTin;
  reason_description?: string;
}

export interface SolarisCreatePersonTaxIdentificationResponse {
  id: string;
  country: string;
  number: string;
  primary: string;
  reason_no_tin: string;
  reason_description: string;
}

export interface SolarisCreateIdentificationInput {
  method: string;
  language: string;
}

export interface SolarisCreateIdentificationResponse {
  id: string;
  reference: string;
  url: string;
  status: string;
  language: string;
  completed_at: string;
  method: string;
  proof_of_address_type: string;
  proof_of_address_issued_at: string;
}

export class SolarisGenerateIdentificationUrlResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: PersonIdentificationStatus })
  status: PersonIdentificationStatus;

  @ApiProperty()
  completed_at: string;

  @ApiProperty()
  method: string;

  @ApiProperty()
  estimated_waiting_time: number;
}

export class SolarisMobileNumberResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  verified: boolean;
}
