import { BaanxUserGenderType } from '../enums/baanx.enum';
import { BaanxKycStatus } from '../common/enums';

export class BaanxUserResponse {
  external_id: string;
  id: string;
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
  house_number: number;
  postcode: number;
  dateOfBirth: string; // Date ISO
  created_at: string;
  updated_at: string;
  country_id: string;
}

export class BaanxUserSessionResponse {
  reference_codes: {
    EUR: string;
    GBP: string;
  };
  kyc_status: BaanxKycStatus;
  kyc_reason?: string;
  user_pass_kyc: boolean;
  session?: {
    id: string;
    user_id: string;
    access_token: string;
    expiry_date: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
  };
  user?: BaanxUserResponse;
}

export class BaanxUserKycResponse {
  requestId: string;
}
