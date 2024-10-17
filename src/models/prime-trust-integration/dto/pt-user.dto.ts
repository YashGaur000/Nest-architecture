import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { PrimeTrustCardActions, PrimeTrustTypes } from '../enums/pt-enums';
import { ApiProperty } from '@nestjs/swagger';

export class UserIdentityDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;
}

export class DeleteRelatedContactDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  contact_id: string;
}

export class UserEmailDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}

export class UserDocumentTypeDto extends UserIdentityDto {
  @IsNotEmpty()
  @ApiProperty()
  documentType: string;
}

export class UserPhoneNumberDto {
  @IsNotEmpty()
  @ApiProperty()
  phoneNumber: string;
}

export class UserOtpDto extends UserIdentityDto {
  @IsNotEmpty()
  @ApiProperty()
  otp: string;
}

export class UserActionTypeDto extends UserIdentityDto {
  @IsNotEmpty()
  @ApiProperty()
  actionType: PrimeTrustCardActions;
}

export class PTObject {
  // TODO: REVERT
  @ApiProperty()
  data: {
    type: PrimeTrustTypes;
    // eslint-disable-next-line @typescript-eslint/ban-types
    attributes: object;
  };
}

export class PrimeTrustPhoneNumber {
  @ApiProperty()
  country: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  sms: boolean;
}

export class PrimeTrustAddress {
  @ApiProperty()
  'street-1': string;

  @ApiProperty()
  'street-2': string;

  @ApiProperty()
  postal_code: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  country: string;
}

export class PrimeTrustKYCDetails {
  @ApiProperty()
  'contact-type': string;

  @ApiProperty()
  'name': string;

  @ApiProperty()
  'email': string;

  @ApiProperty()
  'date-of-birth': string;

  @ApiProperty()
  'geolocation': string;

  @ApiProperty()
  'sex': string;

  @ApiProperty()
  'tax-id-number': string;

  @ApiProperty()
  'tax-country': string;

  @ApiProperty({ type: () => PrimeTrustPhoneNumber })
  'primary-phone-number': PrimeTrustPhoneNumber;

  @ApiProperty({ type: () => PrimeTrustAddress })
  'primary-address': PrimeTrustAddress;
}

export class PrimeTrustCreateAccount {
  @ApiProperty()
  'account-type': string;

  @ApiProperty()
  'name': string;

  @ApiProperty()
  'authorized-signature': string;

  @ApiProperty()
  'owner': PrimeTrustKYCDetails;
}

export class PTBusinessQuestionnaire {
  'purpose-of-account': string;
  'associations-with-other-accounts': string;
  'source-of-assets-and-income': string;
  'intended-use-of-account': string;
  'anticipated-types-of-assets': string;
  'anticipated-monthly-cash-volume': string;
  'anticipated-trading-patterns': string;
  'anticipated-monthly-transactions-incoming': string;
  'anticipated-monthly-transactions-outgoing': string;
  'nature-of-business-of-the-company': string;
}
export class PTCreateBusinessAccount {
  'account-type': string;
  'name': string;
  'account-questionnaire'?: PTBusinessQuestionnaire;
  'authorized-signature': string;
  'owner': {
    'contact-type': string;
    name: string;
    email: string;
    'date-of-birth': string;
    sex: string;
    'tax-id-number': string;
    'tax-country': string;
    'primary-phone-number': PrimeTrustPhoneNumber;
    'primary-address': PrimeTrustAddress;
    'related-contacts'?: PrimeTrustKYCDetails[];
  };
}

export class PTCreateAccountBody {
  @ApiProperty()
  data: {
    type: string;
    attributes: PrimeTrustCreateAccount | PTCreateBusinessAccount;
  };
}

export class PTUserDto extends PTCreateAccountBody {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;
}

export class PTRelatedContactUpdateDocuments {
  files: FileData[];
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  contact_id: string;
}
export class PTRelatedContactDto {
  files: FileData[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  'relationships-to': string;

  data: {
    type: string;
    attributes: {
      'contact-type': string;
      name: string;
      'primary-phone-number': PrimeTrustPhoneNumber;
      'primary-address': PrimeTrustAddress;
      'tax-id-number': string;
      email: string;
      'date-of-birth': string;
    };
  };
}

export class PTUploadDocumentBody {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  public: boolean;

  @ApiProperty()
  file: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  resubmitting: boolean;
}

export class PTBusinessUploadDocumentBody {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;
  files: FileData[];
}

export class FileData {
  @ApiProperty()
  label: string;

  @ApiProperty()
  public: boolean;

  @ApiProperty()
  file: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileName: string;
}

export class PTDocumentCheckBody extends PTObject {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;
}

export class PTUpdateKYCBody extends PTObject {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @ApiProperty()
  contact_id?: string;
}

export class PTDocumentCheckAttributes {
  'contact-id': string;
  'uploaded-document-id': string;
  'backside-document-id': string;
  'kyc-document-type': string;
  'identity': boolean;
  'identity-photo': boolean;
  'proof-of-address': boolean;
  'kyc-document-country': string;
}
