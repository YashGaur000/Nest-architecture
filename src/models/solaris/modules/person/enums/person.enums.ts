export enum PersonSalutationEnum {
  MR = 'MR',
  MS = 'MS',
}

export enum PersonEmploymentStatusEnum {
  EMPLOYED = 'EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
  PUBLIC_SECTOR_EMPLOYEE = 'PUBLIC_SECTOR_EMPLOYEE',
  PROFESSIONAL_SOLDIER = 'PROFESSIONAL_SOLDIER',
  FREELANCER = 'FREELANCER',
  HOUSEWORK = 'HOUSEWORK',
  APPRENTICE = 'APPRENTICE',
  MANAGEMENT = 'MANAGEMENT',
  RETIRED = 'RETIRED',
  STUDENT = 'STUDENT',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  MILITARY_OR_COMMUNITY_SERVICE = 'MILITARY_OR_COMMUNITY_SERVICE',
}

export enum PersonMaritalStatusEnum {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  UNKNOWN = 'UNKNOWN',
}

export enum PersonTaxReasonNoTin {
  HAVE_TAX_ID = 'HAVE_TAX_ID',
  NOT_ASSIGNED_YET = 'NOT_ASSIGNED_YET',
  NOT_ASSIGNED_BY_COUNTRY = 'NOT_ASSIGNED_BY_COUNTRY',
  OTHER = 'OTHER',
}

export enum PersonIdentificationStatus {
  created = 'created',
  pending = 'pending',
  pending_successful = 'pending_successful',
  pending_failed = 'pending_failed',
  successful = 'successful',
  aborted = 'aborted',
  canceled = 'canceled',
  failed = 'failed',
}

export enum PersonIdentificationRequestAction {
  REQUEST_URL = 'REQUEST_URL',
  RETRY_BY_CUSTOMER = 'RETRY_BY_CUSTOMER',
  NEW_IDENTIFICATION = 'NEW_IDENTIFICATION',
  NONE = 'NONE',
}

export enum PersonIdentificationFinal {
  YES = 'YES',
  NO = 'NO',
}
