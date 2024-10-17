import rs from 'jsrsasign';

export const pemToHex = (pem: string): string => {
  const key = rs.KEYUTIL.getKey(pem);
  return key?.pubKeyHex;
};
