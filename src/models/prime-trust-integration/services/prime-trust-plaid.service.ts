import { Injectable, Logger } from '@nestjs/common';
import {
  Products,
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  PlaidApi,
} from 'plaid';
import { PLAID_CLIENT_ID, PLAID_ENV, PLAID_SECRET } from 'src/environments';
import { Configuration, PlaidEnvironments } from 'plaid/dist/configuration';
import { PlaidLinkToken } from '../models/pt-models';

@Injectable()
export class PrimeTrustPlaidService {
  client: PlaidApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
        },
      },
    });
    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(): Promise<PlaidLinkToken> {
    const request = {
      user: {
        client_user_id: Date.now().toString(),
      },
      client_name: 'Kash.io',
      products: [Products.Auth],
      language: 'en',
      country_codes: [CountryCode.Us],
    };
    try {
      const response = await this.client.linkTokenCreate(request);
      return { link_token: response.data.link_token };
    } catch (error) {
      Logger.error('Create Link Token Error: ',error);
    }
  }

  async createPlaidProcessorToken(metadata: string): Promise<string> {
    const metadataObj = JSON.parse(metadata);
    const response = await this.client.itemPublicTokenExchange({
      public_token: metadataObj.public_token,
    });
    const accessToken = response.data.access_token;
    const connectedAccounts = metadataObj['accounts'];
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: connectedAccounts[0].id,
      processor: ProcessorTokenCreateRequestProcessorEnum.PrimeTrust,
    };
    try {
      const processorTokenResponse = await this.client.processorTokenCreate(
        request,
      );
      return processorTokenResponse.data.processor_token;
    } catch (error) {
      Logger.error('Create Plaid Processor Token Error: ',error);
    }
  }
}
