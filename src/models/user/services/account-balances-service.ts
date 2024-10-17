import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MORALIS_API_KEY } from '../../../environments';
import {
  AssetsBalance,
  MarketSwapRate,
  UserBalance,
} from '../common/user-interfaces';
import { UserBalanceType } from '../common/user-balances.enum';
import { calcAssetValue, div, getYesterday, toAmount } from '../common/parse';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { PrimeTrustTransfersService } from '../../prime-trust-integration/services/prime-trust-transfers.service';

const web3 = createAlchemyWeb3(
  'https://eth-mainnet.alchemyapi.io/v2/PunuQmqYNQSAjwnoQq7lJMDIEpSxY0i5',
);

@Injectable()
export class AccountBalancesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly ptTransferService: PrimeTrustTransfersService,
  ) {}

  getAsset(token: string) {
    return this.httpService
      .post('https://graph.mirror.finance/graphql', {
        operationName: 'GetAsset',
        variables: { yesterday: getYesterday(), token },
        query: `
       query GetAsset($token: String!, $yesterday: Float!) {
          asset(token: $token) {
              symbol
              name
              token
              pair
              description
              news {
                  datetime
                  headline
                  source
                  url
                  summary
              }
              prices {
                  price
                  priceAt(timestamp: $yesterday)
              }
          }
      }`,
      })
      .toPromise()
      .then((response) => {
        return response?.data;
      })
      .then((response) => {
        return response?.data?.asset;
      });
  }

  async getAssetsBalances(address: string): Promise<UserBalance[]> {
    const assetBalances = await this.httpService
      .post('https://graph.mirror.finance/graphql', {
        operationName: 'GetBalances',
        variables: { address },
        query: `
        query GetBalances($address: String!) {
           balances(address: $address) {
              token
              balance
           }
        }`,
      })
      .toPromise()
      .then((response) => {
        return response?.data?.data;
      })
      .then((response) => {
        return response.balances.filter((token) => token.token !== 'uusd');
      })
      .then((response: AssetsBalance[]) => {
        return response.map((item) => {
          return {
            denom: item.token,
            balance: item.balance,
            type: UserBalanceType.TERRA_ASSET,
          };
        });
      });

    const balances: UserBalance[] = [];
    for (const item of assetBalances) {
      const asset = await this.getAsset(item.denom);
      if (asset) {
        const value = calcAssetValue(item.balance, asset?.prices?.price);

        balances.push({
          ...item,
          balance: value,
        });
      }
    }

    return balances;
  }

  async getTerraBalances(walletAddress): Promise<UserBalance[]> {
    const lastSyncedHeight = await this.fetchLastSyncedHeight();
    const terraBalances = await this.httpService
      .post('https://mantle.terra.dev', {
        operationName: 'GetAnchorDeposit',
        variables: {
          walletAddress,
          anchorTokenContract: 'terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu',
          anchorTokenBalanceQuery: JSON.stringify({
            balance: { address: walletAddress },
          }),
          moneyMarketContract: 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s',
          moneyMarketEpochQuery: JSON.stringify({
            epoch_state: {
              block_height: lastSyncedHeight,
            },
          }),
        },
        query: `
        query GetAnchorDeposit(
            $walletAddress: String!
            $anchorTokenContract: String!
            $anchorTokenBalanceQuery: String!
            $moneyMarketContract: String!
            $moneyMarketEpochQuery: String!
        ) {
        bankBalances: BankBalancesAddress(Address: $walletAddress) {
          Result {
            Denom
            Amount
          }
        }
        aUSTBalance: WasmContractsContractAddressStore(
          ContractAddress: $anchorTokenContract
          QueryMsg: $anchorTokenBalanceQuery
        ) {
          Result
        }
        exchangeRate: WasmContractsContractAddressStore(
          ContractAddress: $moneyMarketContract
          QueryMsg: $moneyMarketEpochQuery
        ) {
          Result
        }
    }
      `,
      })
      .toPromise()
      .then((response) => {
        return response?.data?.data;
      })
      .then((data) => {
        return {
          aUSTBalance: data.aUSTBalance?.Result
            ? JSON.parse(data.aUSTBalance?.Result)
            : null,
          exchangeRate: JSON.parse(data.exchangeRate?.Result),
          bankBalances:
            data.bankBalances &&
            data.bankBalances?.Result.map(({ Amount, Denom }) => ({
              balance: Amount,
              denom: Denom,
              type: UserBalanceType.TERRA_TOKEN,
            })),
        };
      });

    const balances: UserBalance[] = [];

    if (terraBalances?.aUSTBalance) {
      const rate = Number(terraBalances?.exchangeRate?.exchange_rate) ?? 1;
      balances.push({
        balance: String(Number(terraBalances?.aUSTBalance.balance) * rate),
        denom: 'aUST',
        type: UserBalanceType.TERRA_TOKEN,
      });
    }

    if (terraBalances?.bankBalances && terraBalances?.bankBalances?.length) {
      balances.push(...terraBalances?.bankBalances);
    }

    const marketSwapRates = await this.getMarketSwapRate();

    return balances.map((balance) => {
      const marketSwapRate = marketSwapRates.find(
        (val) => val.denom === balance.denom,
      );

      let value = balance.balance;
      if (marketSwapRate) {
        value = toAmount(
          div(balance.balance, toAmount(marketSwapRate.swaprate)),
        );
      }

      return {
        ...balance,
        balance: value,
      };
    });
  }

  fetchLastSyncedHeight(): Promise<number> {
    return this.httpService
      .post('https://mantle.terra.dev', {
        operationName: 'getLastSyncedHeight',
        query: `
          query getLastSyncedHeight {
              LastSyncedHeight
          }`,
      })
      .toPromise()
      .then((response) => {
        return response?.data;
      })
      .then((result) => result && result.data?.LastSyncedHeight);
  }

  async getEthereumBalances(address: string): Promise<UserBalance[]> {
    const balances: UserBalance[] = [];
    const rawBalance = await web3.eth.getBalance(address, 'latest');
    const ethBalance = web3.utils.fromWei(rawBalance);
    if (ethBalance && ethBalance !== '0') {
      const ethAsset = await this.getAsset(
        'terra1dk3g53js3034x4v5c3vavhj2738une880yu6kx',
      );
      balances.push({
        balance: (
          Number(toAmount(ethBalance)) * Number(ethAsset?.prices?.price)
        ).toString(),
        denom: 'ETH',
        type: UserBalanceType.ETH_TOKEN,
      });
    }

    const ethereumBalances = await this.httpService
      .get(`https://deep-index.moralis.io/api/v2/${address}/erc20?chain=eth`, {
        headers: {
          'X-API-KEY': MORALIS_API_KEY,
        },
      })
      .toPromise()
      .then((response) => response.data)
      .then((response) => {
        const addresses = Object.values({
          DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
          ADAI: '0x23affce94d2a6736de456a25eb8cc96612ca55ca',

          USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          AUSDT: '0x54e076dba023251854f4c29ea750566528734b2d',

          USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          AUSDC: '0x94ead8f528a3af425de14cfdda727b218915687c',

          BUSD: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
          ABUSD: '0x5a6a33117ecbc6ea38b3a140f3e20245052cc647',

          WUST: '0xa47c8bf37f92abed4a126bda807a7b7498661acd',
          WAUST: '0xa8de3e3c934e2a1bb08b010104ccabbd4d6293ab',

          ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2_ETH',
        });

        const filteredResult = response.filter((it) =>
          addresses.includes(it.token_address),
        );

        return filteredResult.map((obj) => {
          if (obj.symbol !== 'USDC' && obj.symbol !== 'USDT') {
            // Note: DAI and all are 18 decimals but I had to remove just 12 here because somewhere
            // in effects automatically 1e-6 is being applied on all tokens.
            obj.balance = Number(obj.balance) * 1e-12;
          }
          if (obj.symbol === 'UST') {
            obj.symbol = 'WUST';
          }
          if (obj.symbol === 'aUST') {
            obj.symbol = 'aWUST';
          }
          return {
            denom: obj.symbol as string,
            balance: obj.balance as number,
            type: UserBalanceType.ETH_TOKEN,
          };
        });
      });

    balances.push(...ethereumBalances);
    return balances;
  }

  getMarketSwapRate(): Promise<MarketSwapRate[]> {
    return this.httpService
      .get('https://fcd.terra.dev/v1/market/swaprate/uusd')
      .toPromise()
      .then((response) => {
        return response?.data;
      });
  }

  async getUsdBalance(identity: string): Promise<UserBalance> {
    const response: { disbursable: string } =
      await this.ptTransferService.getAccountUSDBalance(identity);
    if (response?.disbursable) {
      return {
        balance: (Number(response.disbursable) * 1e6).toString(),
        denom: 'USD',
        type: UserBalanceType.USD_TOKEN,
      };
    } else {
      return null;
    }
  }
}
