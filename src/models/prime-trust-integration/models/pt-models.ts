export class PrimeTrustKycStep {
  current_kyc_step: string;
}

export interface PlaidLinkToken {
  link_token: string;
}

export interface BusinessKYCStatus {
  company_status: KycStatusResponse;
  related_contacts_status: KycStatusResponse[];
}

export interface KycStatusResponse {
  'aml-cleared': boolean;
  'cip-cleared': boolean;
  'identity-documents-verified': boolean;
  'proof-of-address-documents-verified': boolean;
  'identity-confirmed': boolean;
  'kyc-required-actions': any;
  'kyc-status'?: any;
  'cip-status': any;
  'account-id': string;
  'contact-id'?: string;
  'complete-status'?: boolean;
  name?: string;
}

export interface USDTransferHistoryResponse {
  amount: string;
  status: string;
  'settled-at': string;
  'funds-transfer-type': string;
  'created-at': string;
  'clears-on': string;
  'contingincies-cleared-at'?: string;
}
export interface RelatedContactsInfoResponse {
  contact_id: string;
  name: string;
}

export interface CashTransactionsResponse {
  amount: string;
  type: string;
  funds_transfer_type: string;
  settled_at: string;
}

export interface USTTransferHistoryResponse {
  amount: string;
  status: string;
  'transaction-hash': string;
  'created-at': string;
  'contingincies-cleared-at'?: string;
}

export interface PTWebhookResponse {
  id: string;
  'account-id': string;
  action: string;
  data: any;
  'resource-id': string;
  'resource-type': string;
  account_id: string;
  resource_id: string;
  resource_type: string;
}
export interface ConnectedBanksDetailsResponse {
  'transfer-method-id': string;
  'bank-account-name': string;
  'bank-account-type': string;
  inactive: boolean;
}

export interface AssetTransferInformationResponse {
  wallet_address: string;
  memo: string;
}

export interface AssetTransferResponse {
  status: boolean;
  amount: string;
}
export interface WireInstructionsResponse {
  wire_international_instructions: string;
  wire_us_instructions: string;
}
