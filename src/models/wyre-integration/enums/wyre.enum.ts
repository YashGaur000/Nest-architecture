export enum WyreAccountValues {
  email = 'individualEmail',
  cellPhone = 'individualCellphoneNumber',
  legalName = 'individualLegalName',
  dateOfBirth = 'individualDateOfBirth',
  socialSecurityNumber = 'individualSsn',
  address = 'individualResidenceAddress',
  governmentId = 'individualGovernmentId',
  paymentMethod = 'individualSourceOfFunds',
  proofOfAddress = 'individualProofOfAddress',
}

export enum WYRE_API {
  AUTH_API = '/v2/sessions/auth/key',
  ACCOUNT_API = '/v3/accounts/',
  PAYMENT_API = '/v2/paymentMethods/',
  TRANFER_API = '/v3/transfers/'
}

export enum WYRE_TRANSFER {
  local = 'LOCAL_TRANSFER',
  international = '',
}

export enum WYRE_DOCUMENT_TYPE {
  GOVT_ID = 'GOVT_ID',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  PASSPORT_CARD = 'PASSPORT_CARD',
  PASSPORT = 'PASSPORT',
}

export enum WYRE_DOCUMENT_SUB_TYPE {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export enum WYRE_COINS{
    ETH = 'ETH',
    DAI = 'DAI',
    USDC = 'USDC',
}

export enum WyreApiSteps {
  ADDRESS="ADDRESS",
  DOCUMENTS = 'DOCUMENTS',
  PAYMENT_METHOD="PAYMENT_METHOD",
  SUBMITTED= "SUBMITTED"
}
