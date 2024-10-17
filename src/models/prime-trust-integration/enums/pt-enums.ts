import { PRIME_TRUST_UST_ADDRESS } from 'src/environments';

export enum PrimeTrustTypes {
  account = 'account',
  contacts = 'contacts',
  identity_confirmed = 'identity-confirmed',
  kyc_document_check = 'kyc-document-checks',
  funds_transfer_method = 'funds-transfer-methods',
  push_transfer_method = 'push-transfer-methods',
  contributions = 'contributions',
  quotes = 'quotes',
  card_issuance = 'card-holders',
  asset_disbursements = 'asset-disbursements',
  cash_disbursements = 'disbursements',
  asset_transfer_methods = 'asset-transfer-methods',
  asset_contributions = 'asset-contributions',
  wire_instructions = 'contact-funds-transfer-references',
  contact_relationships = 'contact-relationships',
}

export enum PrimeTrustApiSteps {
  ADDRESS = 'ADDRESS',
  DOCUMENTS = 'DOCUMENTS',
  PAYMENT_METHOD = 'PAYMENT_METHOD',
  SUBMITTED = 'SUBMITTED',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
}

export enum PrimeTrustBusinessApiSteps {
  COMPANY_INFO = 'COMPANY_INFO',
  RELATED_CONTACTS = 'RELATED_CONTACTS',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  SUBMITTED = 'SUBMITTED',
}
export enum PrimeTrustApi {
  asset = '/v2/asset-disbursements',
  asset_transfers = '/v2/asset-transfers',
  cash_transactions = '/v2/cash-transactions',
  disbursements = '/v2/disbursements',
  funds_transfer = '/v2/funds-transfer-methods',
  push_transfer = '/v2/push-transfer-methods',
  accounts = '/v2/accounts',
  contributions = '/v2/contributions',
  quotes = '/v2/quotes',
  trades = '/v2/trades',
  contacts = '/v2/contacts',
  kyc_document_check = '/v2/kyc-document-checks',
  card = '/v2/card-holders',
  card_verification = '/v2/card-holder-verifications',
  physical_card = '/v2/cards',
  phone_number = '/v2/phone-numbers',
  account_cash_totals = '/v2/account-cash-totals',
  funds_transfer_history = '/v2/funds-transfers',
  asset_transfer_methods = '/v2/asset-transfer-methods',
  asset_contributions = '/v2/asset-contributions',
  wire_instructions = '/v2/contact-funds-transfer-references',
  contact_relationship = '/v2/contact-relationships',
}

export const PrimeTrustAssetId = {
  UST: PRIME_TRUST_UST_ADDRESS,
  USDC: '',
  ETH: 'e63b0367-c47b-49be-987a-f14036b230cd', //These are sandbox ids
  DAI: '',
};

export enum PrimeTrustCardStatus {
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  VIRTUAL_CARD_ORDERED = 'VIRTUAL_CARD_ORDERED',
  PHYSICAL_CARD_ORDERED = 'PHYSICAL_CARD_ORDERED',
}

export enum PrimeTrustTradeTypes {
  BUY = 'BUY',
  SELL = 'SELL',
}
export enum PrimeTrustCardActions {
  ORDER_PHYSICAL_CARD = 'request-physical',
  LOCK_CARD = 'lock',
  UNLOCK_CARD = 'unlock',
  REISSUE_CARD = 'reissue',
  ACTIVATE_PHYSICAL_CARD = 'activate-physical',
}

export enum PrimeTrustDocumentType {
  DRIVER_LICENSE = 'drivers_license',
  PASSPORT = 'passport',
  ADDRESS_PROOF = 'proof_of_address',
}

export enum PrimeTrustStatus {
  OPENED = 'opened',
}

export enum PrimeTrustQuotes {
  BUY = 'buy',
  SELL = 'sell',
}

export enum PrimeTrustHookResourceTypes {
  ASSET_TRANSFERS = 'asset_transfers',
  CONTACT = 'contact',
}
