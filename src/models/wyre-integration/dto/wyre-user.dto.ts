import {
  WYRE_COINS,
  WYRE_DOCUMENT_SUB_TYPE,
  WYRE_DOCUMENT_TYPE,
} from '../enums/wyre.enum';

export class WyreObject {
  fieldId: string;
  value: string;
}

export class WyreUserDto {
  identity: string;
  accountId: string;
  secretKey: string;
}

export class WyreUpdateInformationDto {
  identity: string;
  data: WyreObject[];
}

export class WyreKycRequestPayload {
  address: WyreObject;
  identity: string;
  data: WyreObject[];
}

export class WyreCreatePaymentDto {
  identity: string;
  metadata: string;
}

export class WyreCreateTransfer {
  identity: string;
  destinationAddress: string;
  destinationCurrency: WYRE_COINS;
  amount: string;
  paymentMethod: string;
}

export class WyreConfirmTransfer {
  identity: string;
  transferId: string;
}
export interface WyreUploadDocument {
  fieldId: string;
  identity: string;
  documentType: WYRE_DOCUMENT_TYPE;
  documentSubType?: WYRE_DOCUMENT_SUB_TYPE;
  file: string;
  fileType: string;
}

export class ProcessorRequest {
  public_token: string;
  metadata: string;
}
