import {
  GetAccountResponse,
  SolarisAccount,
} from '../intefaces/accounts.interfaces';

export const mapToSolarisAccount = (
  getAccountResponse: GetAccountResponse,
): SolarisAccount => {
  return {
    bic: getAccountResponse.bic,
    iban: getAccountResponse.iban,
    balance: getAccountResponse.balance,
    available_balance: getAccountResponse.available_balance,
  };
};
