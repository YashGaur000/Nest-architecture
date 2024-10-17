import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from 'plaid';
import { randomBytes } from 'crypto';
import {
  WYRE_API,
  WYRE_TRANSFER,
  WyreAccountValues,
  WyreApiSteps,
} from '../enums/wyre.enum';
import {
  PLAID_CLIENT_ID,
  PLAID_ENV,
  PLAID_SECRET,
  WYRE_ACCOUNT_ID,
  WYRE_API_ENDPOINT,
} from 'src/environments';
import {
  WyreConfirmTransfer,
  WyreCreatePaymentDto,
  WyreCreateTransfer,
  WyreKycRequestPayload,
  WyreObject,
  WyreUpdateInformationDto,
  WyreUploadDocument,
} from '../dto/wyre-user.dto';
import { WyreUserRepository } from '../repositories/wyre-user.repository';
import { WyreUser } from '../schemas/wyre-user.schema';

@Injectable()
export class WyrePlaidService {
  client: PlaidApi;

  constructor(
    private readonly httpService: HttpService,
    private readonly wyreUserRepo: WyreUserRepository,
  ) {
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

  async createWyreUser(identity: string): Promise<string> {
    try {
      let secretKey;
      let userDetails: WyreUser = {};
      userDetails = await this.wyreUserRepo.getUserByIdentity(identity);
      if (!userDetails) {
        console.log('Inside if logic');
        secretKey = await this.generateWyreSecretKey();
        userDetails = await this.wyreUserRepo.createBaseUser(
          identity,
          secretKey,
        );
      } else {
        console.log('Inside else function');
        secretKey = userDetails.secret_key;
      }
      if (userDetails.account_id) {
        console.log('inside account id logic');

        await this.createWyreAuthentication(userDetails.secret_key);
        console.log('userDetaisl=>>', userDetails);
        return userDetails.account_id;
      }
      console.log('here');

      const wyreUser = await this.createWyreAccount(secretKey);
      userDetails.account_id = wyreUser['id'];
      userDetails.current_kyc_step = WyreApiSteps.ADDRESS;
      await this.wyreUserRepo.updateBaseUser(identity, userDetails);

      console.log('userDetaisl=>>', userDetails);
      return userDetails.account_id;
    } catch (error) {
      console.log('create user error =>>', error);
    }
  }

  async generateWyreSecretKey() {
    const secretKey = randomBytes(30).toString('hex');
    return secretKey;
  }

  async getWyreAccountInformation(identity: string) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(identity);

      const data = await this.httpService
        .get(
          WYRE_API_ENDPOINT +
            WYRE_API.ACCOUNT_API +
            user.account_id +
            '?masqueradeAs=' +
            user.account_id,
          this.getOptions(user.secret_key),
        )
        .toPromise();
      return data.data;
    } catch (error) {}
  }

  async getAccountStatus(identity: string) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(identity);

      const data = await this.httpService
        .get(
          WYRE_API_ENDPOINT +
            WYRE_API.ACCOUNT_API +
            user.account_id +
            '/profileFieldsStatuses',
          this.getOptions(user.secret_key),
        )
        .toPromise();
      return data.data;
    } catch (error) {}
  }

  async updateWyreAccount(body: WyreUpdateInformationDto): Promise<any> {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(body.identity);
      const updateWyreAccount = {
        profileFields: [body.data[0]],
      };
      const data = this.httpService.post(
        WYRE_API_ENDPOINT +
          WYRE_API.ACCOUNT_API +
          user.account_id +
          '?masqueradeAs=' +
          user.account_id,
        updateWyreAccount,
        this.getOptions(user.secret_key),
      );
      return data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Update KYC Details failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateWyrePersonalDetails(body: WyreKycRequestPayload) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(body.identity);
      const jsonAddress = JSON.parse(body.address.value);
      const addressObj: WyreObject = {
        fieldId: WyreAccountValues.address,
        value: jsonAddress,
      };
      console.log(user.account_id);
      body.data.push(addressObj);
      console.log(body.data);
      const updateWyreAccount = {
        profileFields: body.data,
      };
      //await this.createWyreAuthentication(user.secret_key);
      const data = await this.httpService
        .post(
          WYRE_API_ENDPOINT + WYRE_API.ACCOUNT_API + user.account_id,
          updateWyreAccount,
          this.getOptions(user.secret_key),
        )
        .toPromise();
      user.current_kyc_step = WyreApiSteps.DOCUMENTS;
      this.wyreUserRepo.updateBaseUser(body.identity, user);
      return data.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Submit KYC Details Failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadWyreDocument(body: WyreUploadDocument) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(body.identity);
      await this.httpService
        .post(
          WYRE_API_ENDPOINT +
            WYRE_API.ACCOUNT_API +
            user.account_id +
            '/' +
            body.fieldId +
            '?documentType=' +
            body.documentType +
            '&documentSubType=' +
            body.documentSubType +
            '&timestamp=' +
            Date.now(),
          {
            File: 'body.file',
          },
          {
            headers: {
              Authorization: 'Bearer ' + user.secret_key,
              'Content-Type': body.fileType,
            },
          },
        )
        .toPromise();
      if (body.fieldId === WyreAccountValues.proofOfAddress) {
        user.current_kyc_step = WyreApiSteps.PAYMENT_METHOD;
      }

      this.wyreUserRepo.updateBaseUser(body.identity, user);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Submit KYC Documents failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createTransferQuote(body: WyreCreateTransfer) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(body.identity);
      const requestObj = {
        autoConfirm: false,
        sourceCurrency: 'USD',
        destCurrency: body.destinationCurrency,
        sourceAmount: body.amount,
        destAmount: null,
        preview: true,
        amountIncludesFees: true,
        dest: `ethereum:${body.destinationAddress}`,
        source: `paymentmethod:${body.paymentMethod}:ach`,
      };
      const response = await this.httpService
        .post(
          WYRE_API_ENDPOINT + WYRE_API.TRANFER_API,
          requestObj,
          this.getOptions(user.secret_key),
        )
        .toPromise();
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Create Transfer Quote Creation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async confirmTransferQuote(body: WyreConfirmTransfer) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(body.identity);
      const response = await this.httpService
        .post(
          WYRE_API_ENDPOINT + WYRE_API.TRANFER_API + body.transferId,
          null,
          this.getOptions(user.secret_key),
        )
        .toPromise();
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Confirm Transfer failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createWyrePaymentMethod(body: WyreCreatePaymentDto) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(body.identity);
      const plaidProcessorToken = await this.createPlaidProcessorToken(
        body.metadata,
      );
      const wyrePaymentMethod = {
        plaidProcessorToken: plaidProcessorToken,
        paymentMethodType: WYRE_TRANSFER.local,
        country: 'US',
      };
      const data = await this.httpService
        .post(
          WYRE_API_ENDPOINT + WYRE_API.PAYMENT_API,
          wyrePaymentMethod,
          this.getOptions(user.secret_key),
        )
        .toPromise();
      console.log(data);
      user.current_kyc_step = WyreApiSteps.SUBMITTED;
      this.wyreUserRepo.updateBaseUser(body.identity, user);
      //  console.log("data res ====>",data.data);
      return data.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Payment Method Creation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async listWyrePaymentMethods(identity: string) {
    try {
      const user = await this.wyreUserRepo.getUserByIdentity(identity);
      console.log('secret==>', user.secret_key);
      const response = await this.httpService
        .get(
          WYRE_API_ENDPOINT + WYRE_API.PAYMENT_API,
          this.getOptions(user.secret_key),
        )
        .toPromise();
      return response.data.data;
    } catch (error) {}
  }

  async createLinkToken(): Promise<any> {
    const request = {
      user: {
        client_user_id: Date.now().toString(),
      },
      client_name: 'Kash.io',
      products: [Products.Auth],
      language: 'en',
      country_codes: [CountryCode.Us],
      link_customization_name: 'demo',
    };
    try {
      const response = await this.client.linkTokenCreate(request);
      console.log(response.data);
      return {
        token: response.data.link_token,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Plaid Link Token Creation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createPlaidProcessorToken(metadata: string): Promise<string> {
    const metaObj = JSON.parse(metadata);
    const response = await this.client.itemPublicTokenExchange({
      public_token: metaObj.public_token,
    });
    const accessToken = response.data.access_token;
    const connectedAccounts = metaObj.accounts;
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: connectedAccounts[0].id,
      processor: ProcessorTokenCreateRequestProcessorEnum.Wyre,
    };
    try {
      const processorTokenResponse = await this.client.processorTokenCreate(
        request,
      );
      return processorTokenResponse.data.processor_token;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Plaid Processor Token Creation Failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getOptions(secretKey: string) {
    return {
      headers: {
        Authorization: 'Bearer ' + secretKey,
      },
    };
  }

  private async createWyreAuthentication(secretKey: string) {
    const data = await this.httpService
      .post(
        WYRE_API_ENDPOINT + WYRE_API.AUTH_API,
        {
          secretKey: secretKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .toPromise();
    console.log('Secret Key', secretKey);
    return data;
  }

  private async createWyreAccount(secretKey: string) {
    try {
      await this.createWyreAuthentication(secretKey);
      const newWyreAccount = {
        type: 'INDIVIDUAL',
        country: 'US',
        subaccount: true,
        referrerAccountId: WYRE_ACCOUNT_ID,
      };
      const data = await this.httpService
        .post(
          WYRE_API_ENDPOINT + WYRE_API.ACCOUNT_API,
          newWyreAccount,
          this.getOptions(secretKey),
        )
        .toPromise();
      return data.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Create Wyre failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
