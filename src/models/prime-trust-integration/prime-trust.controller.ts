import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  PTCreateContribution,
  PTCreatePaymentDto,
  PTCreateQuote,
} from './dto/pt-payment.dto';
import {
  DeleteRelatedContactDto,
  PTBusinessUploadDocumentBody,
  PTRelatedContactDto,
  PTRelatedContactUpdateDocuments,
  PTUpdateKYCBody,
  PTUploadDocumentBody,
  PTUserDto,
  UserActionTypeDto,
  UserDocumentTypeDto,
  UserEmailDto,
  UserIdentityDto,
  UserOtpDto,
  UserPhoneNumberDto,
} from './dto/pt-user.dto';
import { PrimeTrustHookResourceTypes, PrimeTrustTypes } from './enums/pt-enums';
import {
  BusinessKYCStatus,
  ConnectedBanksDetailsResponse,
  KycStatusResponse,
  PlaidLinkToken,
  PrimeTrustKycStep,
  PTWebhookResponse,
  RelatedContactsInfoResponse,
} from './models/pt-models';
import { PrimeTrustUserRepository } from './repositories/prime-trust-user.repository';
import { PrimeTrustCardService } from './services/prime-trust-card.service';
import { PrimeTrustIntegrationService } from './services/prime-trust-integration.service';
import { PrimeTrustPlaidService } from './services/prime-trust-plaid.service';
import { PrimeTrustTransfersService } from './services/prime-trust-transfers.service';
import { UsdSendTransactionDto } from './dto/pt-transfer.dto';
import { ApiTags } from '@nestjs/swagger';
import { PrimeTrustBusinessUser } from './schemas/prime-trust-business.schema';
import { PrimeTrustBusinessUserRepository } from './repositories/prime-trust-business-user.repository';

@ApiTags('prime-trust')
@Controller('prime-trust')
export class PrimeTrustController {
  constructor(
    private readonly ptService: PrimeTrustIntegrationService,
    private readonly primeTrustUserRepo: PrimeTrustUserRepository,
    private readonly ptPlaidService: PrimeTrustPlaidService,
    private readonly ptTransferService: PrimeTrustTransfersService,
    private readonly ptCardService: PrimeTrustCardService,
    private readonly ptBusinessRepo: PrimeTrustBusinessUserRepository,
  ) {}

  @Post('user/create')
  @HttpCode(200)
  createPTUser(@Body() userDetails: PTUserDto): Promise<string> {
    return this.ptService.createAccount(userDetails);
  }

  @Post('business/create')
  @HttpCode(200)
  createPTBusinessUser(
    @Body() userDetails: PTUserDto,
  ): Promise<PrimeTrustBusinessUser> {
    return this.ptService.createBusinessAccount(userDetails);
  }

  @Post('user/update')
  @HttpCode(200)
  updatePTUser(@Body() userDetails: PTUpdateKYCBody): Promise<void> {
    return this.ptService.updateKycInformation(userDetails);
  }

  @Post('business/questionnaire')
  @HttpCode(200)
  updatePTBusinessUser(@Body() userDetails: PTUpdateKYCBody): Promise<void> {
    return this.ptService.updateBusinessKycInformation(userDetails);
  }

  @Post('business/get-step')
  @HttpCode(200)
  getBusinessKYCStep(@Body() body: PTUserDto): Promise<PrimeTrustKycStep> {
    return this.ptBusinessRepo.getUserCurrentStep(body.identity);
  }

  @Post('business/update-step')
  @HttpCode(200)
  updateBusinessKYCStep(@Body() body: PTUserDto): Promise<void> {
    return this.ptBusinessRepo.updateBusinessKYCStep(body.identity);
  }

  @Post('business/get-related-contacts')
  @HttpCode(200)
  getRelatedContacts(
    @Body() body: UserIdentityDto,
  ): Promise<RelatedContactsInfoResponse[]> {
    return this.ptService.getBusinessRelatedContacts(body.identity);
  }

  @Post('business/get-related-contacts-status')
  @HttpCode(200)
  getRelatedContactsStatus(
    @Body() body: UserIdentityDto,
  ): Promise<BusinessKYCStatus> {
    return this.ptService.getBusinessRelatedContactsStatus(body.identity);
  }

  @Post('business/update-related-contact')
  @HttpCode(200)
  updateRelatedContact(@Body() userDetails: PTUpdateKYCBody): Promise<void> {
    return this.ptService.updateRelatedContactInfo(userDetails);
  }

  @Post('business/delete-related-contact')
  @HttpCode(200)
  deleteRelatedContact(
    @Body() body: DeleteRelatedContactDto,
  ): Promise<RelatedContactsInfoResponse[]> {
    return this.ptService.deleteRelatedContact(body);
  }

  @Post('kyc/upload-documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fieldSize: 8 * 1024 * 1024, fileSize: 8 * 1024 * 1024 },
    }),
  )
  @HttpCode(200)
  uploadDocuments(@UploadedFile() file, @Body() body: PTUploadDocumentBody) {
    return this.ptService.uploadDocument(body);
  }

  @Post('business/kyc/upload-documents')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fieldSize: 8 * 1024 * 1024, fileSize: 8 * 1024 * 1024 },
    }),
  )
  @HttpCode(200)
  uploadBusinessDocuments(
    @UploadedFiles() files,
    @Body() body: PTBusinessUploadDocumentBody,
  ) {
    return this.ptService.uploadBusinessDocuments(body);
  }

  @Post('business/kyc/create-related-contacts')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { fieldSize: 8 * 1024 * 1024, fileSize: 8 * 1024 * 1024 },
    }),
  )
  @HttpCode(200)
  createRelatedContacts(
    @UploadedFiles() files,
    @Body() body: PTRelatedContactDto,
  ) {
    return this.ptService.createRelatedContacts(body);
  }

  @Post('business/kyc/update-related-contacts-documents')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { fieldSize: 8 * 1024 * 1024, fileSize: 8 * 1024 * 1024 },
    }),
  )
  @HttpCode(200)
  updateRelatedContactDocuments(
    @UploadedFiles() files,
    @Body() body: PTRelatedContactUpdateDocuments,
  ) {
    return this.ptService.updateRelatedContactDocuments(body);
  }

  @Post('user/get-kyc-step')
  @HttpCode(200)
  getUserKYCStep(@Body() body: UserIdentityDto): Promise<PrimeTrustKycStep> {
    try {
      return this.primeTrustUserRepo.getUserCurrentStep(body.identity);
    } catch (error) {
      Logger.error('PT Get KYC Step Error: ',error);
    }
  }

  @Post('user/create-payment-method')
  @HttpCode(200)
  createPaymentMethod(@Body() body: PTCreatePaymentDto) {
    try {
      return this.ptService.createPtPaymentMethod(body);
    } catch (error) {
      Logger.log(error);
    }
  }

  @Post('payment/contribution')
  @HttpCode(200)
  createContribution(@Body() body: PTCreateContribution) {
    Logger.log('body create contribution method');
    try {
      return this.ptTransferService.createContribution(body);
    } catch (error) {
      Logger.log(error);
    }
  }

  @Post('payment/execute')
  @HttpCode(200)
  executeTransaction(@Body() body: PTCreateQuote) {
    Logger.log('body create contribution method');
    try {
      return this.ptTransferService.generateQuote(body);
    } catch (error) {
      Logger.log(error);
    }
  }

  @Post('payment/get-push-instructions')
  @HttpCode(200)
  getPushInstructions(@Body() body: UserIdentityDto) {
    return this.ptTransferService.createPushTransferMethod(body.identity);
  }

  @Post('payment/get-wire-instructions')
  @HttpCode(200)
  getWireInstructions(@Body() body: UserIdentityDto) {
    return this.ptTransferService.createWireTransferMethod(body.identity);
  }

  @Post('transfers/get-usd-txn-history')
  @HttpCode(200)
  getPushTransfersStatus(@Body() body: UserIdentityDto) {
    return this.ptTransferService.getUSDTransferHistory(body.identity);
  }

  @Post('transfers/get-exchange-history')
  @HttpCode(200)
  getCashTransactions(@Body() body: UserIdentityDto) {
    return this.ptTransferService.getCashTransactions(body.identity);
  }

  @Post('transfers/get-ust-txn-history')
  @HttpCode(200)
  getUSTTransferStatus(@Body() body: UserIdentityDto) {
    return this.ptTransferService.getUSTTransferHistory(body.identity);
  }

  @Get('plaid/link_token')
  @HttpCode(200)
  createLinkToken(): Promise<PlaidLinkToken> {
    return this.ptPlaidService.createLinkToken();
  }

  @Post('user/kyc-status')
  @HttpCode(200)
  getKYCDocumentChecks(
    @Body() body: UserIdentityDto,
  ): Promise<KycStatusResponse> {
    return this.ptService.getKycStatusDetails(body.identity);
  }

  @Post('user/connected-banks')
  @HttpCode(200)
  getConnectedBanks(
    @Body() body: UserIdentityDto,
  ): Promise<ConnectedBanksDetailsResponse[]> {
    return this.ptService.getPTPaymentMethods(body.identity);
  }

  @Post('user/contact-info')
  @HttpCode(200)
  getContactDetails(
    @Body() body: UserIdentityDto,
  ): Promise<{ email: string; number: string }> {
    return this.ptCardService.getContactDetails(body.identity);
  }

  @Post('card/create-mail-verification')
  @HttpCode(200)
  createEmailVerification(
    @Body() body: UserEmailDto,
  ): Promise<{ success: boolean }> {
    return this.ptCardService.createEmailVerification(body.email);
  }

  @Post('card/create-number-verification')
  @HttpCode(200)
  createPhoneVerification(
    @Body() body: UserPhoneNumberDto,
  ): Promise<{ success: boolean }> {
    return this.ptCardService.createPhoneVerification(body.phoneNumber);
  }

  @Post('card/verify-number')
  @HttpCode(200)
  verifyPhoneNumber(@Body() body: UserOtpDto): Promise<{ success: boolean }> {
    return this.ptCardService.verifyPhone(body.identity, body.otp);
  }

  @Post('card/verify-email')
  @HttpCode(200)
  verifyEmail(@Body() body: UserOtpDto): Promise<{ success: boolean }> {
    return this.ptCardService.verifyEmail(body.identity, body.otp);
  }

  @Post('card/get-status')
  @HttpCode(200)
  getCardIssuanceStatus(
    @Body() body: UserIdentityDto,
  ): Promise<{ status: string }> {
    return this.ptCardService.getCardIssuanceStatus(body.identity);
  }

  @Post('user/kyc-check')
  @HttpCode(200)
  uploadKycCheck(
    @Body() body: UserDocumentTypeDto,
  ): Promise<{ status: string }> {
    return this.ptService.kycDocumentCheck(body.identity, body.documentType);
  }

  @Post('card/actions')
  @HttpCode(200)
  cardActions(@Body() body: UserActionTypeDto) {
    return this.ptCardService.cardActions(body.identity, body.actionType);
  }

  @Post('user/account-balance')
  @HttpCode(200)
  getAccountUsdBalance(@Body() body: UserIdentityDto) {
    return this.ptTransferService.getAccountUSDBalance(body.identity);
  }

  @Post('payment/send-usd')
  sendUsd(@Body() body: UsdSendTransactionDto) {
    return this.ptTransferService.transferUSD(body.identity, body.data);
  }

  @Post('payment/get-offramp-details')
  getOffRampDetails(@Body() body: UserIdentityDto) {
    return this.ptTransferService.getOffRampDetails(body.identity);
  }

  @Post('/hook')
  async getHook(@Body() body: PTWebhookResponse) {
    Logger.log('Working Hook', body);

    if (body['resource-type'] === PrimeTrustHookResourceTypes.ASSET_TRANSFERS) {
      Logger.log('Inside asset transfer hook');
      await this.ptTransferService.offRampHook(body);
    }
    const tempArray: Array<string> = body?.data?.changes;
    if (tempArray === undefined) {
      return;
    }
    if (
      body.resource_type === PrimeTrustHookResourceTypes.CONTACT &&
      tempArray.includes(PrimeTrustTypes.identity_confirmed)
    ) {
      Logger.log(body);
      /**
       * TODO Need to re-enable it later after once the template is in place
       */
      const email = await this.ptCardService.getEmail(body.resource_id);
      await this.ptService.sendMail(email);
    }
  }
  @Post('user/connected-banks')
  @HttpCode(200)
  fetchConnectedBanks(@Body() body: UserIdentityDto) {
    return this.ptService.getConnectedbanks(body.identity);
  }
}
