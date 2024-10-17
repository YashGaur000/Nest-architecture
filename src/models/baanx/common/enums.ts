export enum BaanxCurrency {
  GBP = 'GBP',
  EUR = 'EUR',
}

export enum BaanxKycStatus {
  STARTED = 7001,
  SUBMITTED = 7002,
  VERIFIED = 9001,
  DENIED = 9102,
  RESUBMIT = 9103,
  EXPIRED = 9104,
  ISSUE = 400,
}
