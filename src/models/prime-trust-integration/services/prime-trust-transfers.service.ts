import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  PTCreateContribution,
  PTCreateQuote,
  PTOffRampQuote,
} from '../dto/pt-payment.dto';
import { PRIME_TRUST_API } from 'src/environments';
import { PTCashTransferDto, PTTransferDto } from '../dto/pt-transfer.dto';
import {
  PrimeTrustApi,
  PrimeTrustAssetId,
  PrimeTrustQuotes,
  PrimeTrustTradeTypes,
  PrimeTrustTypes,
} from '../enums/pt-enums';
import {
  AssetTransferInformationResponse,
  AssetTransferResponse,
  CashTransactionsResponse,
  PTWebhookResponse,
  USDTransferHistoryResponse,
  USTTransferHistoryResponse,
  WireInstructionsResponse,
} from '../models/pt-models';
import { PrimeTrustUserRepository } from '../repositories/prime-trust-user.repository';
import { PrimeTrustUser } from '../schemas/prime-trust-user.schema';
import { UserProfileService } from '../../user/services/user-profile.service';
import { PrimeTrustCardService } from './prime-trust-card.service';
import { PrimeTrustJwtService } from './prime-trust-jwt.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrimeTrustTransfersService {
  constructor(
    private readonly httpService: HttpService,
    private readonly primeTrustUserRepository: PrimeTrustUserRepository,
    private readonly primeTrustCardService: PrimeTrustCardService,
    private readonly userProfileService: UserProfileService,
    private readonly primeTrustJwtService: PrimeTrustJwtService,
  ) {}

  getHeaders() {
    const jwtToken = this.primeTrustJwtService.getJwtToken();
    return {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    };
  }

  async createTransferMethod(body: PTTransferDto) {
    const jwtToken = this.primeTrustJwtService.getJwtToken();
    try {
      firstValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.funds_transfer}`,
          body.data,
          {
            headers: {
              Authorization: jwtToken,
            },
          },
        ),
      ).then(({ data }) => {
        if (data.error) {
          throw new HttpException(
            'Something went wrong. Please try again later',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        return data;
      });
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async getPushTransferInstructions(push_transfer_method_id: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${PRIME_TRUST_API}${PrimeTrustApi.push_transfer}/${push_transfer_method_id}`,
          this.getHeaders(),
        ),
      );
      return res.data.data.attributes['push-instructions'];
    } catch (error) {
      Logger.error('PT Push Transfer Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getWireTransferInstructions(
    wire_transfer_method_id: string,
  ): Promise<WireInstructionsResponse> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${PRIME_TRUST_API}${PrimeTrustApi.wire_instructions}/${wire_transfer_method_id}`,
          this.getHeaders(),
        ),
      );
      return {
        wire_international_instructions:
          res.data.data.attributes['wire-instructions-intl'],
        wire_us_instructions: res.data.data.attributes['wire-instructions'],
      };
    } catch (error) {
      Logger.error('PT Wire Transfer Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createPushTransferMethod(identity: string) {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      if (!user.push_transfer_method_id) {
        const requestBody = {
          data: {
            type: PrimeTrustTypes.push_transfer_method,
            attributes: {
              'account-id': user.account_id,
              'contact-id': user.contact_id,
            },
          },
        };
        const res = await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.push_transfer}`,
            requestBody,
            this.getHeaders(),
          ),
        );
        user.push_transfer_method_id = res.data.data.id;

        await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
          identity,
          user,
        );
      }
      return await this.getPushTransferInstructions(
        user.push_transfer_method_id,
      );
    } catch (error) {
      Logger.error('PT Push Transfer Method Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createWireTransferMethod(identity: string) {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      if (!user.wire_transfer_method_id) {
        const requestBody = {
          data: {
            type: PrimeTrustTypes.wire_instructions,
            attributes: {
              'contact-id': user.contact_id,
              'account-id': user.account_id,
            },
          },
        };
        const res = await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.wire_instructions}`,
            requestBody,
            this.getHeaders(),
          ),
        );

        user.wire_transfer_method_id = res.data.data.id;

        await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
          identity,
          user,
        );
      }
      return await this.getWireTransferInstructions(
        user.wire_transfer_method_id,
      );
    } catch (error) {
      Logger.error('PT Wire Transfer Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUSDTransferHistory(
    identity: string,
  ): Promise<USDTransferHistoryResponse[]> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const res = await firstValueFrom(
        this.httpService.get(
          `${PRIME_TRUST_API}${PrimeTrustApi.funds_transfer_history}?account.id=${user.account_id}`,
          this.getHeaders(),
        ),
      );

      return res.data.data.map((it) => {
        return {
          amount: it.attributes.amount,
          status: it.attributes.status,
          'settled-at': it.attributes['settled-at'],
          'funds-transfer-type': it.attributes['funds-transfer-type'],
          'created-at': it.attributes['created-at'],
          'clears-on': it.attributes['clears-on'],
          'contingencies-cleared-at': it.attributes['contingencies-cleared-at'],
        };
      });
    } catch (error) {
      Logger.error('PT USD History Error: ', JSON.stringify(error));
    }
  }

  async getCashTransactions(
    identity: string,
  ): Promise<CashTransactionsResponse[]> {
    try {
      const mainUser = await this.userProfileService.getUserByIdentity(
        identity,
      );

      if (!mainUser || mainUser?.isUserBlocked) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );

      if (!user) {
        throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
      }

      const response = (
        await firstValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.cash_transactions}?account.id=${user.account_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;

      const returnValue: CashTransactionsResponse[] = [];

      response.data?.map((value: any) => {
        if (value?.attributes['funds-transfer-type'] === 'trade') {
          const temp: CashTransactionsResponse = {
            amount:
              value?.attributes?.amount > 0
                ? value?.attributes?.amount
                : Number(value?.attributes?.amount) * -1,
            type:
              value?.attributes?.amount > 0
                ? PrimeTrustTradeTypes.SELL
                : PrimeTrustTradeTypes.BUY,
            funds_transfer_type: value?.attributes['funds-transfer-type'],
            settled_at: value?.attributes['settled-at'],
          };
          returnValue.push(temp);
        }
      });
      return returnValue;
    } catch (error) {
      Logger.error('Cash Transaction Error: ', error.response.data.errors);
    }
  }

  async getUSTTransferHistory(
    identity: string,
  ): Promise<USTTransferHistoryResponse[]> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const res = (
        await firstValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.asset_transfers}?account.id=${user.account_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;

      const returnValue: USTTransferHistoryResponse[] = [];

      res?.data?.map((value: any) => {
        if (value.attributes['unit-count'] < 0) {
          const temp = {
            amount: (Number(value?.attributes['unit-count']) * -1).toString(),
            status: value?.attributes?.status,
            'transaction-hash': value?.attributes['transaction-hash'],
            'created-at': value?.attributes['created-at'],
            'contingencies-cleared-at':
              value?.attributes['contingencies-cleared-at'],
          };
          returnValue.push(temp);
        }
      });
      return returnValue;
    } catch (error) {
      Logger.log('Error =>', error);
    }
  }

  async getAccountUSDBalance(identity: string) {
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      if (!user) {
        throw new HttpException(
          'User not Found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const res = await firstValueFrom(
        this.httpService.get(
          `${PRIME_TRUST_API}${PrimeTrustApi.account_cash_totals}?account.id=${user.account_id}`,
          this.getHeaders(),
        ),
      );

      return res?.data?.data[0]?.attributes;
    } catch (error) {
      Logger.log(error?.response?.data);
    }
  }

  async createContribution(body: PTCreateContribution) {
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        body.identity,
      );

      const requestBody = {
        data: {
          type: PrimeTrustTypes.contributions,
          attributes: {
            'account-id': user.account_id,
            'funds-transfer-method-id': body['funds-transfer-method-id'],
            amount: body.amount,
          },
        },
      };
      const res = (
        await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.contributions}?include=funds-transfer`,
            requestBody,
            this.getHeaders(),
          ),
        )
      )?.data;
    } catch (error) {
      Logger.error('PT Contribution Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateQuote(body: PTCreateQuote) {
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        body.identity,
      );

      const requestBody = {
        data: {
          type: PrimeTrustTypes.quotes,
          attributes: {
            'account-id': user.account_id,
            'asset-id': PrimeTrustAssetId[body.asset],
            hot: true,
            'transaction-type': PrimeTrustQuotes.BUY,
            amount: body.amount,
          },
        },
      };

      const res = (
        await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.quotes}`,
            requestBody,
            this.getHeaders(),
          ),
        )
      )?.data;
      await this.executeQuote(res.data.id);
      while (true) {
        const quoteInfo = (
          await firstValueFrom(
            this.httpService.get(
              `${PRIME_TRUST_API}${PrimeTrustApi.quotes}/${res.data.id}`,
              this.getHeaders(),
            ),
          )
        )?.data;
        Logger.log(JSON.stringify(quoteInfo.data.attributes));
        if (
          quoteInfo.data.attributes.status === 'settled' ||
          quoteInfo.data.attributes.status === 'executed'
        ) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      await this.tryTransferAsset(
        user,
        res.data.attributes['unit-count'],
        body.asset,
        body.walletAddress,
      );
      return res;
    } catch (error) {
      Logger.error('Generating Quote Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async tryTransferAsset(
    user: PrimeTrustUser,
    amount: string,
    asset: string,
    walletAddress: string,
  ) {
    const uuid = uuidv4();
    let index = 4;
    const header = this.getHeaders();
    let response;
    header.headers['X-Idempotent-ID-V2'] = uuid;
    while (index > 0) {
      try {
        const body = {
          data: {
            type: PrimeTrustTypes.asset_disbursements,
            attributes: {
              'account-id': user.account_id,
              'unit-count': amount,
              'hot-transfer': true,
              'asset-transfer-method': {
                'asset-id': PrimeTrustAssetId[asset],
                'contact-id': user.contact_id,
                'wallet-address': walletAddress,
                'transfer-direction': 'outgoing',
                'single-use': false,
                'asset-transfer-type': 'terra',
              },
            },
          },
        };

        response = await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.asset}?include=asset-transfers`,
            body,
            header,
          ),
        );
        if (response.status === 201) {
          break;
        }
        index--;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        Logger.error('Transfer Idempotent error', JSON.stringify(error));
      }
    }
    if (response.status != 201) {
      throw new HttpException(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async transferAsset(
    user: PrimeTrustUser,
    amount: string,
    asset: string,
    walletAddress: string,
  ) {
    try {
      const body = {
        data: {
          type: PrimeTrustTypes.asset_disbursements,
          attributes: {
            'account-id': user.account_id,
            'unit-count': amount,
            'hot-transfer': true,
            'asset-transfer-method': {
              'asset-id': PrimeTrustAssetId[asset],
              'contact-id': user.contact_id,
              'wallet-address': walletAddress,
              'transfer-direction': 'outgoing',
              'single-use': false,
              'asset-transfer-type': 'terra',
            },
          },
        },
      };

      await firstValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.asset}?include=asset-transfers`,
          body,
          this.getHeaders(),
        ),
      );
    } catch (error) {
      Logger.log('Transferring asset error =>', error.response.data.errors[0]);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async transferUSD(identity: string, body: PTCashTransferDto) {
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      const contactDetails = await this.primeTrustCardService.getContactDetails(
        identity,
      );
      const req = {
        data: {
          type: PrimeTrustTypes.cash_disbursements,
          attributes: {
            'account-id': user.account_id,
            amount: body.amount,
            'funds-transfer-method': {
              'funds-transfer-type': 'ach',
              'ach-check-type': 'personal',
              'bank-account-name': body['account-name'],
              'bank-account-type': body['account-type'],
              'bank-account-number': body['account-number'],
              'routing-number': body['routing-number'],
              'contact-email': contactDetails.email,
              'contact-name': body['account-name'],
            },
          },
        },
      };
      (
        await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.disbursements}`,
            req,
            this.getHeaders(),
          ),
        )
      )?.data;
    } catch (error) {
      Logger.error('PT Transfer USD Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getAssetTransfer(
    asset_transfer_id: string,
  ): Promise<AssetTransferResponse> {
    try {
      const response = (
        await firstValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.asset_transfers}/${asset_transfer_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;

      return {
        status: response.data.attributes.status,
        amount: response.data.attributes['unit-count'],
      };
    } catch (error) {
      Logger.error('Get Asset Transfer Error: ', JSON.stringify(error));
    }
  }

  async offRampHook(body: PTWebhookResponse) {
    try {
      if (body.action !== 'update' || body?.data?.changes === undefined) {
        return;
      }
      if (body.data.changes.includes('contingencies-cleared-on')) {
        const asset_transfer_info = await this.getAssetTransfer(
          body.resource_id,
        );
        if (Number(asset_transfer_info.amount) > 0) {
          await this.executeOffRamp({
            account_id: body.account_id,
            amount: asset_transfer_info.amount,
            asset: 'UST',
          });
        }
      }
    } catch (error) {
      Logger.error('Off Ramp Hook Method Error: ', JSON.stringify(error));
    }
  }

  async getOffRampDetails(
    identity: string,
  ): Promise<AssetTransferInformationResponse> {
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );

      if (!user.asset_transfer_info) {
        const req = {
          data: {
            type: PrimeTrustTypes.asset_transfer_methods,
            attributes: {
              'asset-id': PrimeTrustAssetId.UST,
              'transfer-direction': 'incoming',
              'asset-transfer-type': 'terra',
              'contact-id': user.contact_id,
              'single-use': false,
            },
          },
        };

        const response = (
          await firstValueFrom(
            this.httpService.post(
              `${PRIME_TRUST_API}${PrimeTrustApi.asset_transfer_methods}`,
              req,
              this.getHeaders(),
            ),
          )
        )?.data;

        user.asset_transfer_info = {
          wallet_address: response.data.attributes['wallet-address'],
          memo: response.data.attributes['tag'],
        };
        await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
          identity,
          user,
        );
      }
      return user.asset_transfer_info;
    } catch (error) {
      Logger.error(error.response.data);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //This needs to be triggered from the Webhook once we send UST from Kash Wallet to PT Wallet then it needs to automatically convert the sent funds to USD
  private async executeOffRamp(body: PTOffRampQuote) {
    try {
      const requestBody = {
        data: {
          type: PrimeTrustTypes.quotes,
          attributes: {
            'account-id': body.account_id,
            'asset-id': PrimeTrustAssetId['UST'],
            hot: false,
            'transaction-type': PrimeTrustQuotes.SELL,
            'unit-count': body.amount,
          },
        },
      };

      const res = (
        await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.quotes}`,
            requestBody,
            this.getHeaders(),
          ),
        )
      )?.data;
      await this.executeQuote(res.data.id);
      return res;
    } catch (error) {
      Logger.error('PT Off Ramp Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async executeQuote(quoteId: string) {
    try {
      const res = (
        await firstValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.quotes}/${quoteId}/execute`,
            undefined,
            this.getHeaders(),
          ),
        )
      )?.data;
      return res;
    } catch (error) {
      Logger.error('Executing Quote Error: ', JSON.stringify(error));
      throw error;
    }
  }
}
