import {
  DeleteRelatedContactDto,
  PTBusinessUploadDocumentBody,
  PTRelatedContactDto,
  PTRelatedContactUpdateDocuments,
  PTUpdateKYCBody,
  PTUploadDocumentBody,
  PTUserDto,
} from '../dto/pt-user.dto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  PLAID_CLIENT_ID,
  PLAID_ENV,
  PLAID_SECRET,
  PRIME_TRUST_API,
  PRIME_TRUST_HOOK,
  PRIME_TRUST_MAIL,
  SENDGRID_API_KEY,
} from 'src/environments';
import { PrimeTrustUserRepository } from '../repositories/prime-trust-user.repository';
import {
  PrimeTrustApi,
  PrimeTrustApiSteps,
  PrimeTrustBusinessApiSteps,
  PrimeTrustDocumentType,
  PrimeTrustStatus,
  PrimeTrustTypes,
} from '../enums/pt-enums';
import { PTCreatePaymentDto } from '../dto/pt-payment.dto';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import {
  BusinessKYCStatus,
  ConnectedBanksDetailsResponse,
  KycStatusResponse,
  RelatedContactsInfoResponse,
} from '../models/pt-models';
import FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';
import { IncomingMessage } from 'http';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { UserProfileService } from '../../user/services/user-profile.service';
import sgMail from '@sendgrid/mail';
import { PrimeTrustUserBank } from '../schemas/prime-trust-user.schema';
import { PrimeTrustBusinessUserRepository } from '../repositories/prime-trust-business-user.repository';
import { PrimeTrustPlaidService } from './prime-trust-plaid.service';
import { RelatedContacts } from '../schemas/prime-trust-business.schema';

import sharp from 'sharp';
import { PrimeTrustJwtService } from './prime-trust-jwt.service';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class PrimeTrustIntegrationService {
  client: PlaidApi;

  constructor(
    private readonly httpService: HttpService,
    private readonly primeTrustUserRepository: PrimeTrustUserRepository,
    private readonly primeTrustPlaidService: PrimeTrustPlaidService,
    private readonly primeTrustBusinessRepository: PrimeTrustBusinessUserRepository,
    private readonly userProfileService: UserProfileService,
    private readonly primeTrustJwtService: PrimeTrustJwtService,
  ) {
    sgMail.setApiKey(SENDGRID_API_KEY);
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

  getHeaders() {
    const jwtToken = this.primeTrustJwtService.getJwtToken();
    return {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    };
  }

  async createBusinessAccount(businessAccountDetails: PTUserDto) {
    try {
      let user = await this.primeTrustBusinessRepository.getUserByIdentity(
        businessAccountDetails.identity,
      );
      if (user && user.account_id) {
        return this.primeTrustBusinessRepository.getUserByIdentity(
          businessAccountDetails.identity,
        );
      }

      if (!user) {
        user =
          await this.primeTrustBusinessRepository.createPrimeTrustBaseBusinessUser(
            businessAccountDetails.identity,
          );
      }
      businessAccountDetails.data.attributes['webhook-config'] = {
        url: PRIME_TRUST_HOOK,
      };

      const accountInfo = (
        await lastValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}/v2/accounts?include=contacts`,
            { data: businessAccountDetails.data },
            this.getHeaders(),
          ),
        )
      )?.data;

      user.account_id = accountInfo?.data?.id;
      user.contact_id = accountInfo?.data?.relationships?.contacts?.data[0]?.id;
      user.current_kyc_step = PrimeTrustBusinessApiSteps.RELATED_CONTACTS;
      Logger.log(
        'User account ID=>',
        user.account_id,
        'User contact ID=>',
        user.contact_id,
      );
      await this.primeTrustBusinessRepository.updatePrimeTrustBaseBusinessUser(
        businessAccountDetails.identity,
        user,
      );
    } catch (error) {
      Logger.log(error.response.data.errors);
      throw new HttpException(
        error?.response?.data?.errors[0]?.detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createAccount(accountDetails: PTUserDto) {
    const mainUser = await this.userProfileService.getUserByIdentity(
      accountDetails.identity,
    );

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      let user = await this.primeTrustUserRepository.getUserByIdentity(
        accountDetails.identity,
      );
      if (user && user.account_id) {
        return await this.primeTrustUserRepository.getUserByIdentity(
          accountDetails.identity,
        );
      }
      if (!user) {
        user = await this.primeTrustUserRepository.createPrimeTrustBaseUser(
          accountDetails.identity,
        );
      }
      accountDetails.data.attributes['webhook-config'] = {
        url: PRIME_TRUST_HOOK,
      };
      const accountInfo = (
        await lastValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}/v2/accounts?include=contacts`,
            { data: accountDetails.data },
            this.getHeaders(),
          ),
        )
      )?.data;
      user.account_id = accountInfo.data.id;
      user.contact_id = accountInfo.data.relationships.contacts.data[0].id;
      user.current_kyc_step = PrimeTrustApiSteps.DOCUMENTS;

      await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
        accountDetails.identity,
        user,
      );
      return accountInfo.data;
    } catch (error) {
      Logger.error(JSON.stringify(error));
      Logger.error('PT Create Account Error: ', error.response.data.errors);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getContactId(accountId: string) {
    return lastValueFrom(
      this.httpService.get(
        `${PRIME_TRUST_API}/v2/contacts?account.id=${accountId}`,
        this.getHeaders(),
      ),
    ).then((info) => {
      return info.data.data.id;
    });
  }

  async getKycStatusDetails(identity: string): Promise<KycStatusResponse> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );

      if (!user) {
        throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
      }

      const res = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}?account.id=${user.account_id}&include=kyc-document-checks,cip-checks`,
            this.getHeaders(),
          ),
        )
      )?.data;
      const pending_status = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.accounts}/${user.account_id}`,
            this.getHeaders(),
          ),
        )
      )?.data?.data?.attributes?.status;

      return {
        'aml-cleared': res.data[0].attributes['aml-cleared'],
        'cip-cleared': res.data[0].attributes['cip-cleared'],
        'identity-documents-verified':
          res.data[0].attributes['identity-documents-verified'],
        'proof-of-address-documents-verified': true,
        'identity-confirmed': res.data[0].attributes['identity-confirmed'],
        'kyc-required-actions': res.data[0].attributes['kyc-required-actions'],
        'kyc-status': res.included[0].attributes.status,
        'cip-status': res.included[1].attributes.status,
        'account-id': user.account_id,
        'complete-status': pending_status === PrimeTrustStatus.OPENED,
      };
    } catch (error) {
      Logger.error(JSON.stringify(error));
      throw new HttpException(
        error?.response?.data?.errors[0]?.detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteRelatedContact(
    body: DeleteRelatedContactDto,
  ): Promise<RelatedContactsInfoResponse[]> {
    try {
      const response = await this.getBusinessRelatedContacts(body.identity);
      let contact_ids: string[] = [];
      response.map((it: RelatedContactsInfoResponse) => {
        contact_ids.push(it.contact_id);
      });

      if (!contact_ids.includes(body.contact_id)) {
        throw new HttpException(
          `Contact ID doesn't match with related contacts`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const res = (
        await lastValueFrom(
          this.httpService.delete(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}/${body.contact_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;

      let relatedContactsInfo = await this.getBusinessRelatedContacts(
        body.identity,
      );

      return relatedContactsInfo;
    } catch (error) {
      Logger.log(error.response.data.errors);
      throw new HttpException(
        error?.response?.data?.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessRelatedContactsStatus(
    identity: string,
  ): Promise<BusinessKYCStatus> {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        identity,
      );

      if (!user) {
        throw new HttpException(
          'Business User Not Found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const company_status = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}/${user.contact_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;

      const companyAccountStatus = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.accounts}/${user.account_id}`,
            this.getHeaders(),
          ),
        )
      )?.data;
      const company_data = company_status?.data;
      let company_info: KycStatusResponse = {
        'aml-cleared': company_data?.attributes['aml-cleared'],
        'cip-cleared': company_data?.attributes['cip-cleared'],
        'cip-status': company_data?.attributes['cip-status'],
        'identity-confirmed': company_data?.attributes['identity-confirmed'],
        'identity-documents-verified':
          company_data?.attributes['identity-documents-confirmed'],
        'proof-of-address-documents-verified': true,
        'kyc-required-actions':
          company_data?.attributes['kyc-required-actions'],
        'kyc-status': companyAccountStatus?.data?.attributes?.status,
        'account-id': user.account_id,
        'contact-id': company_data?.id,
        name: company_data?.attributes?.name,
      };

      const related_res = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}/${user.contact_id}/related-to-contacts?include=kyc-document-checks`,
            this.getHeaders(),
          ),
        )
      )?.data;
      const contact_data = related_res?.data;
      let responses: KycStatusResponse[] = [];

      for (let index = 0; index < contact_data.length; index++) {
        let temp: KycStatusResponse = {
          'aml-cleared': contact_data[index]?.attributes['aml-cleared'],
          'cip-cleared': contact_data[index]?.attributes['cip-cleared'],
          'cip-status': contact_data[index]?.attributes['cip-status'],
          'identity-confirmed':
            contact_data[index]?.attributes['identity-confirmed'],
          'identity-documents-verified':
            contact_data[index]?.attributes['identity-documents-verified'],
          'proof-of-address-documents-verified': true,
          'kyc-required-actions':
            contact_data[index]?.attributes['kyc-required-actions'],
          'kyc-status': related_res?.included[index]?.attributes?.status,
          'account-id': user.account_id,
          'contact-id': contact_data[index]?.id,
          name: contact_data[index]?.attributes?.name,
        };
        responses.push(temp);
      }
      const business_status: BusinessKYCStatus = {
        company_status: company_info,
        related_contacts_status: responses,
      };
      return business_status;
    } catch (error) {
      Logger.log(error);
    }
  }

  async updateRelatedContactInfo(body) {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        body.identity,
      );
      await lastValueFrom(
        this.httpService.patch(
          `${PRIME_TRUST_API}${PrimeTrustApi.contacts}/${body.contact_id}`,
          { data: body.data },
          this.getHeaders(),
        ),
      );
    } catch (error) {
      Logger.log('kyc update error===>', error.response.data);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessRelatedContacts(
    identity: string,
  ): Promise<RelatedContactsInfoResponse[]> {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        identity,
      );

      if (!user) {
        throw new HttpException(
          'Business User Not Found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const res = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}/${user.contact_id}?include=related-to-contacts`,
            this.getHeaders(),
          ),
        )
      )?.data;
      const included = res?.included;
      if (!included) {
        return;
      }
      const relatedContactsInfo: RelatedContactsInfoResponse[] = [];
      included.map((it: any) => {
        const temp: RelatedContactsInfoResponse = {
          contact_id: it.id,
          name: it.attributes.name,
        };
        relatedContactsInfo.push(temp);
      });
      return relatedContactsInfo;
    } catch (error) {
      Logger.log(
        'Get Business Related Contacts Error',
        error.response.data.errors,
      );
      throw new HttpException(
        error.response?.data?.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadBusinessDocuments(body: PTBusinessUploadDocumentBody) {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        body.identity,
      );
      for (let index = 0; index < body.files.length; index++) {
        const fileContent = Buffer.from(
          body.files[index].file.replace(/^data:.*,/, ''),
          'base64',
        );

        if (!fs.existsSync('./src/file_holder')) {
          fs.mkdirSync('./src/file_holder', { recursive: true });
        }

        const uuid = uuidv4();

        const fileType = body.files[index].fileName.split('.');
        fs.writeFileSync(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
          fileContent,
          'base64',
        );
        const formData = new FormData();
        const fileData = fs.createReadStream(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
        );
        formData.append('contact-id', user.contact_id);
        formData.append('file', fileData, {
          filename: `${uuid}.${fileType[fileType.length - 1]}`,
        });

        const jwtToken = this.primeTrustJwtService.getJwtToken();
        const newProm = new Promise<any>((resolve, reject) => {
          let responseBody = '';
          const req = https.request({
            method: 'post',
            host: PRIME_TRUST_API.split('https://')[1],
            path: '/v2/uploaded-documents',
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              ...formData.getHeaders(),
            },
          });
          formData.pipe(req);
          req.on('response', (res: IncomingMessage) => {
            res.on('data', (chunk) => {
              responseBody += chunk.toString();
            });

            res.on('end', () => {
              resolve(JSON.parse(responseBody));
            });
          });
          req.on('error', (err) => {
            reject(err);
          });
          req.write(responseBody);
        });
        const apiRes = await newProm;
        user.document_ids.push(apiRes.data.id);
        fs.unlinkSync(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
        );
      }
      user.current_kyc_step = PrimeTrustBusinessApiSteps.RELATED_CONTACTS;
      await this.primeTrustBusinessRepository.updatePrimeTrustBaseBusinessUser(
        body.identity,
        user,
      );
    } catch (error) {
      Logger.log(error);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateRelatedContactDocuments(body: PTRelatedContactUpdateDocuments) {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        body.identity,
      );
      const doc_ids: string[] = [];

      for (let index = 0; index < body.files.length; index++) {
        const fileContent = Buffer.from(
          body.files[index].file.replace(/^data:.*,/, ''),
          'base64',
        );

        if (!fs.existsSync('./src/file_holder')) {
          fs.mkdirSync('./src/file_holder', { recursive: true });
        }

        const uuid = uuidv4();
        const fileType = body.files[index].fileName.split('.');
        fs.writeFileSync(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
          fileContent,
          'base64',
        );
        const formData = new FormData();
        const fileData = fs.createReadStream(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
        );
        formData.append('contact-id', body.contact_id);
        formData.append('file', fileData, {
          filename: `${uuid}.${fileType[fileType.length - 1]}`,
        });

        const jwtToken = this.primeTrustJwtService.getJwtToken();

        const newProm = new Promise<any>((resolve, reject) => {
          let responseBody = '';
          const req = https.request({
            method: 'post',
            host: PRIME_TRUST_API.split('https://')[1],
            path: '/v2/uploaded-documents',
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              ...formData.getHeaders(),
            },
          });
          formData.pipe(req);
          req.on('response', (res: IncomingMessage) => {
            res.on('data', (chunk) => {
              responseBody += chunk.toString();
            });

            res.on('end', () => {
              resolve(JSON.parse(responseBody));
            });
          });
          req.on('error', (err) => {
            reject(err);
          });
          req.write(responseBody);
        });
        const apiRes = await newProm;

        doc_ids.push(apiRes.data.id);

        fs.unlinkSync(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
        );
      }

      let req = {
        data: {
          type: PrimeTrustTypes.kyc_document_check,
          attributes: {
            'contact-id': body.contact_id,
            identity: true,
            'identity-photo': true,
            'proof-of-address': false,
            'kyc-document-type': body.files[0].label,
            'kyc-document-country': 'US',
          },
        },
      };

      if (
        body.files.length === 2 &&
        body.files[0].label === PrimeTrustDocumentType.DRIVER_LICENSE
      ) {
        let len = doc_ids?.length;
        req.data.attributes['uploaded-document-id'] = doc_ids[len - 2];
        req.data.attributes['backside-document-id'] = doc_ids[len - 1];
      } else {
        let len = doc_ids?.length;
        req.data.attributes['uploaded-document-id'] = doc_ids[len - 1];
      }

      await firstValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.kyc_document_check}`,
          req,
          this.getHeaders(),
        ),
      );
    } catch (error) {
      Logger.log(error);
    }
  }

  async createRelatedContacts(body: PTRelatedContactDto) {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        body.identity,
      );

      if (!user) {
        throw new HttpException(
          'Business User Not Found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      body.data.attributes['tax-country'] = 'US';
      body.data.attributes['tax-state'] =
        body.data.attributes['primary-address'].region;
      body.data.attributes['account-roles'] = ['beneficiary'];
      body.data.attributes['account-id'] = user.account_id;
      const accountInfo = (
        await lastValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.contacts}`,
            { data: body.data },
            this.getHeaders(),
          ),
        )
      )?.data;
      let related_contact: RelatedContacts = {
        contact_id: accountInfo.data.id,
        document_ids: [],
      };

      for (let index = 0; index < body.files.length; index++) {
        const fileContent = Buffer.from(
          body.files[index].file.replace(/^data:.*,/, ''),
          'base64',
        );

        if (!fs.existsSync('./src/file_holder')) {
          fs.mkdirSync('./src/file_holder', { recursive: true });
        }
        const uuid = uuidv4();
        const fileType = body.files[index].fileName.split('.');

        fs.writeFileSync(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
          fileContent,
          'base64',
        );
        const formData = new FormData();
        const fileData = fs.createReadStream(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
        );
        formData.append('contact-id', user.contact_id);
        formData.append('file', fileData, {
          filename: `${uuid}.${fileType[fileType.length - 1]}`,
        });

        const jwtToken = this.primeTrustJwtService.getJwtToken();
        const newProm = new Promise<any>((resolve, reject) => {
          let responseBody = '';
          const req = https.request({
            method: 'post',
            host: PRIME_TRUST_API.split('https://')[1],
            path: '/v2/uploaded-documents',
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              ...formData.getHeaders(),
            },
          });
          formData.pipe(req);
          req.on('response', (res: IncomingMessage) => {
            res.on('data', (chunk) => {
              responseBody += chunk.toString();
            });

            res.on('end', () => {
              resolve(JSON.parse(responseBody));
            });
          });
          req.on('error', (err) => {
            reject(err);
          });
          req.write(responseBody);
        });
        const apiRes = await newProm;

        related_contact.document_ids.push(apiRes.data.id);

        fs.unlinkSync(
          `./src/file_holder/${uuid}.${fileType[fileType.length - 1]}`,
        );
      }

      let req = {
        data: {
          type: PrimeTrustTypes.kyc_document_check,
          attributes: {
            'contact-id': related_contact.contact_id,
            identity: true,
            'identity-photo': true,
            'proof-of-address': false,
            'kyc-document-type': body.files[0].label,
            'kyc-document-country': 'US',
          },
        },
      };

      if (
        body.files.length === 2 &&
        body.files[0].label === PrimeTrustDocumentType.DRIVER_LICENSE
      ) {
        let len = related_contact.document_ids?.length;
        req.data.attributes['uploaded-document-id'] =
          related_contact.document_ids[len - 2];
        req.data.attributes['backside-document-id'] =
          related_contact.document_ids[len - 1];
      } else {
        let len = related_contact.document_ids?.length;
        req.data.attributes['uploaded-document-id'] =
          related_contact.document_ids[len - 1];
      }

      // TODO
      await firstValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.kyc_document_check}`,
          req,
          this.getHeaders(),
        ),
      );

      let bodyRelation = {
        data: {
          type: PrimeTrustTypes.contact_relationships,
          attributes: {
            label: body['relationships-to'],
            'from-contact-id': user.contact_id,
            'to-contact-id': related_contact.contact_id,
          },
        },
      };
      (
        await lastValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.contact_relationship}`,
            bodyRelation,
            this.getHeaders(),
          ),
        )
      )?.data;
      user.related_contacts?.push(related_contact);
      await this.primeTrustBusinessRepository.updatePrimeTrustBaseBusinessUser(
        body.identity,
        user,
      );
    } catch (error) {
      Logger.log('Create Related Contact Error', error.response.data.errors);
      throw new HttpException(
        error?.response?.data?.errors[0]?.detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadDocument(body: PTUploadDocumentBody): Promise<any> {
    const mainUser = await this.userProfileService.getUserByIdentity(
      body.identity,
    );

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        body.identity,
      );
      if (user.document_ids === undefined) {
        user.document_ids = [];
      }

      /**
       * fetch content from base64 url string
       */
      const fileContent = Buffer.from(
        body.file.replace(/^data:.*,/, ''),
        'base64',
      );

      /**
       * Create file_holder directory if not exits
       */
      if (!fs.existsSync('./src/file_holder')) {
        fs.mkdirSync('./src/file_holder', { recursive: true });
      }

      const type = body.fileType.split('/').pop();
      const fileName = `${uuidv4()}.${type}`;
      /**
       * Resize the image
       */
      const imageResizePromise = new Promise<any>((resolve, reject) => {
        sharp(fileContent)
          .resize(1200)
          .toFile(`./src/file_holder/${fileName}`, () => {
            resolve('Success');
          });
      });
      await imageResizePromise;
      const formData = new FormData();

      const fileData = fs.createReadStream(`./src/file_holder/${fileName}`);

      formData.append('contact-id', user.contact_id);
      formData.append('description', body.label);
      formData.append('file', fileData, {
        filename: fileName,
      });
      formData.append('label', body.label);
      formData.append('public', 'true');

      const jwtToken = this.primeTrustJwtService.getJwtToken();
      const newProm = new Promise<any>((resolve, reject) => {
        let responseBody = '';
        const req = https.request({
          method: 'post',
          host: PRIME_TRUST_API.split('https://')[1],
          path: '/v2/uploaded-documents',
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            ...formData.getHeaders(),
          },
        });
        formData.pipe(req);
        req.on('response', (res: IncomingMessage) => {
          res.on('data', (chunk) => {
            responseBody += chunk.toString();
          });

          res.on('end', () => {
            resolve(JSON.parse(responseBody));
          });
        });
        req.on('error', (err) => {
          reject(err);
        });
        req.write(responseBody);
      });
      const apiRes = await newProm;

      user.document_ids.push(apiRes.data.id);
      fs.unlinkSync(`./src/file_holder/${fileName}`);

      if (body.label.includes(PrimeTrustDocumentType.PASSPORT)) {
        user.current_kyc_step = PrimeTrustApiSteps.PROOF_OF_ADDRESS;
        user.proof_of_address = true;
      } else {
        user.current_kyc_step = PrimeTrustApiSteps.SUBMITTED;
      }
      if (body.resubmitting) {
        user.current_kyc_step = PrimeTrustApiSteps.SUBMITTED;
      }
      await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
        body.identity,
        user,
      );
    } catch (error) {
      Logger.error('upload doc error =>', error);
      throw new HttpException(
        error.response?.data?.errors[0]?.detail
          ? error?.response?.data?.errors[0]?.detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateKycInformation(body: PTUpdateKYCBody) {
    const mainUser = await this.userProfileService.getUserByIdentity(
      body.identity,
    );

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        body.identity,
      );
      await lastValueFrom(
        this.httpService.patch(
          `${PRIME_TRUST_API}${PrimeTrustApi.contacts}/${user.contact_id}`,
          { data: body.data },
          this.getHeaders(),
        ),
      );
    } catch (error) {
      Logger.error('PT KYC Update Error: ', JSON.stringify(error));
      throw new HttpException(
        error?.response?.data?.errors[0]?.detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateBusinessKycInformation(body: PTUpdateKYCBody) {
    try {
      const user = await this.primeTrustBusinessRepository.getUserByIdentity(
        body.identity,
      );
      Logger.log(user.account_id);
      await lastValueFrom(
        this.httpService.patch(
          `${PRIME_TRUST_API}${PrimeTrustApi.accounts}/${user.account_id}`,
          { data: body.data },
          this.getHeaders(),
        ),
      );
    } catch (error) {
      Logger.log('Business KYC Update Error', error.response.data.errors);
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async kycDocumentCheck(identity: string, documentType: string) {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      let req: any;
      if (documentType === PrimeTrustDocumentType.DRIVER_LICENSE) {
        req = {
          data: {
            type: 'kyc-document-checks',
            attributes: {
              'contact-id': user.contact_id,
              'uploaded-document-id':
                user.document_ids[user.document_ids.length - 2],
              'backside-document-id':
                user.document_ids[user.document_ids.length - 1],
              'kyc-document-type': documentType,
              identity: true,
              'identity-photo': true,
              'proof-of-address': false,
              'kyc-document-country': 'US',
            },
          },
        };
      } else if (documentType === PrimeTrustDocumentType.PASSPORT) {
        req = {
          data: {
            type: 'kyc-document-checks',
            attributes: {
              'contact-id': user.contact_id,
              'uploaded-document-id':
                user.document_ids[user.document_ids.length - 1],
              'kyc-document-type': documentType,
              identity: true,
              'identity-photo': true,
              'proof-of-address': false,
              'kyc-document-country': 'US',
            },
          },
        };
      } else {
        req = {
          data: {
            type: 'kyc-document-checks',
            attributes: {
              'contact-id': user.contact_id,
              'uploaded-document-id':
                user.document_ids[user.document_ids.length - 1],
              'kyc-document-type': 'passport',
              identity: true,
              'identity-photo': true,
              'proof-of-address': true,
              'kyc-document-country': 'US',
            },
          },
        };
      }

      const res = await lastValueFrom(
        this.httpService.post(
          `${PRIME_TRUST_API}${PrimeTrustApi.kyc_document_check}`,
          req,
          this.getHeaders(),
        ),
      );

      return res.data;
    } catch (error) {
      Logger.error('PT KYC Document Check Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createPtPaymentMethod(body: PTCreatePaymentDto) {
    const mainUser = await this.userProfileService.getUserByIdentity(
      body.identity,
    );

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        body.identity,
      );
      const plaidProcessorToken =
        await this.primeTrustPlaidService.createPlaidProcessorToken(
          body.metadata,
        );
      const PrimeTrustPaymentMethod = {
        data: {
          type: PrimeTrustTypes.funds_transfer_method,
          attributes: {
            'contact-id': user.contact_id,
            'plaid-processor-token': plaidProcessorToken,
            'funds-transfer-type': 'ach',
            'ach-check-type': 'personal',
          },
        },
      };

      const res = (
        await lastValueFrom(
          this.httpService.post(
            `${PRIME_TRUST_API}${PrimeTrustApi.funds_transfer}?include=bank`,
            PrimeTrustPaymentMethod,
            this.getHeaders(),
          ),
        )
      )?.data;
      const userbank: PrimeTrustUserBank = {
        active: !res.data.attributes.inactive,
        bank_name: res.included[0].attributes?.name,
        funds_transfer_method_id: res.data.id,
        bank_account_type: res.data.attributes['bank-account-type'],
      };
      user.connected_banks.push(userbank);
      await this.primeTrustUserRepository.updatePrimeTrustBaseUser(
        body.identity,
        user,
      );
      return res;
    } catch (error) {
      Logger.error('PT Create Payment Method Error: ', JSON.stringify(error));
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPTPaymentMethods(
    identity: string,
  ): Promise<ConnectedBanksDetailsResponse[]> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);

    if (!mainUser || mainUser?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      const res = (
        await lastValueFrom(
          this.httpService.get(
            `${PRIME_TRUST_API}${PrimeTrustApi.funds_transfer}?contact.id=${user.contact_id}&include=bank`,
            this.getHeaders(),
          ),
        )
      )?.data; //not sure if it's enough to use included, or we need ot use the data, we need to parse the data and return only what is required
      const unparsedArray: [] = res.data;
      const unparsedBanks: [] = res.included;
      const returnValue: ConnectedBanksDetailsResponse[] = [];

      for (let index = 0; index < unparsedArray.length; index++) {
        const ftm = res.data[index];
        const rt_num = ftm.attributes['routing-number'];
        const temp: ConnectedBanksDetailsResponse = {
          'transfer-method-id': ftm['id'],
          'bank-account-name': null,
          'bank-account-type': ftm['attributes']['bank-account-type'],
          inactive: ftm['attributes']['inactive'],
        };
        for (let index = 0; index < unparsedBanks.length; index++) {
          const bank: any = unparsedBanks[index];
          if (bank.attributes['routing-number'] === rt_num) {
            temp['bank-account-name'] = bank.attributes.name;
            break;
          }
        }
        returnValue.push(temp);
      }

      return returnValue;
    } catch (error) {
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendMail(email: string) {
    try {
      const msg = {
        to: email, // Change to your recipient
        from: 'contact@kash.io', // Change to your verified sender
        subject: 'Kash ACH Account',
        templateId: PRIME_TRUST_MAIL,
      };
      await sgMail.send(msg);
    } catch (error) {
      Logger.error(error);
    }
  }

  async getConnectedbanks(
    identity: string,
  ): Promise<Array<ConnectedBanksDetailsResponse>> {
    const mainUser = await this.userProfileService.getUserByIdentity(identity);
    if (!mainUser) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      const user = await this.primeTrustUserRepository.getUserByIdentity(
        identity,
      );
      let returnReponse: ConnectedBanksDetailsResponse[];
      (user.connected_banks || []).forEach((bank: PrimeTrustUserBank) => {
        returnReponse.push({
          'bank-account-name': bank.bank_name,
          'bank-account-type': bank.bank_account_type,
          'transfer-method-id': bank.funds_transfer_method_id,
          inactive: !bank.active,
        });
      });
      return returnReponse;
    } catch (error) {
      throw new HttpException(
        error.response.data.errors[0].detail
          ? error.response.data.errors[0].detail
          : 'Something went wrong please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
