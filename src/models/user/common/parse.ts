export const SMALLEST = 1e6;
import BigNumber from 'bignumber.js';
import BN from 'bignumber.js';
import { startOfMinute, subDays } from 'date-fns';

BigNumber.config({ EXPONENTIAL_AT: [-18, 20] });

export const toAmount = (value: string) =>
  value ? new BigNumber(value).times(SMALLEST).integerValue().toString() : '0';

export const div = (a?: BN.Value, b?: BN.Value): string =>
  new BN(a || 0).div(b || 1).toString();

export const times = (a?: BN.Value, b?: BN.Value): string =>
  new BN(a || 0).times(b || 0).toString();

export const getYesterday = () => {
  const now = startOfMinute(new Date());
  return subDays(now, 1).getTime();
};

export const calcAssetValue = (balance, price) => {
  return times(balance, price);
};
