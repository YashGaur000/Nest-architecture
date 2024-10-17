import { Logger } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CryptoJS = require('crypto-js');

export const encrypt = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

export const decrypt = (data: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    Logger.error('Decrypt error');
    return null;
  }
};
