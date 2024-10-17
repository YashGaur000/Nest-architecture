import { BaanxUserGenderType } from '../enums/baanx.enum';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { BaanxCurrency, BaanxKycStatus } from '../common/enums';

export class BaanxCreateUser {
  external_id: string;
  title: string;
  gender: BaanxUserGenderType;
  addressLine1: string;
  addressLine2: string;
  cityOrTown: string;
  countryName: string;
  country_code: string;
  first_name: string;
  last_name: string;
  selected_country: string; //country ISO 3166 alpha-3 code
  email: string;
  phone_number: number;
  postcode: number;
  dateOfBirth: string; // Date ISO
}

export class BaanxUserDto extends BaanxCreateUser {
  @IsNotEmpty()
  identity: string;
}

export class BaanxUserUpdateDto {
  kyc_request_id?: string;
  kyc_status?: BaanxKycStatus;
  kyc_reason?: string;
  user_pass_kyc?: boolean;
}

export class BaanxUserSessionDto {
  @IsNotEmpty()
  identity: string;
}

export class BaanxUserKycImage {
  @IsNotEmpty()
  context: string;
  @IsNotEmpty()
  content: string;
}

export class BaanxUserKyc {
  externalId: string;
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  images: BaanxUserKycImage[];
}

export class BaanxUserKycDto extends BaanxUserKyc {
  @IsNotEmpty()
  identity: string;
}

export class BaanxUserPassKycDto {
  @IsNotEmpty()
  identity: string;
}

export class BaanxUserKycStatus {
  requestId: string;
  requestStatus: number;
  reason: string;
  person: {
    firstName: string;
    lastName: string;
    idNumber: string;
    citizenship: string;
    dateOfBirth: string;
    gender: string;
  };
}
