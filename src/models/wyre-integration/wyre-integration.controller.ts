import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { WyrePlaidService } from './services/wyre-plaid.service';
import {
  WyreUpdateInformationDto,
  WyreCreatePaymentDto,
  WyreKycRequestPayload,
  WyreUploadDocument,
  WyreCreateTransfer,
  WyreConfirmTransfer,
} from './dto/wyre-user.dto';
import { WyreUserRepository } from './repositories/wyre-user.repository';
import { WyreUser } from './schemas/wyre-user.schema';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('wyre')
@Controller('wyre')
export class WyreIntegrationController {
  constructor(
    private wyreService: WyrePlaidService,
    private wyreUserRepo: WyreUserRepository,
  ) {}

  @Post('user/create')
  @HttpCode(200)
  createWyreUser(@Query('identity') userIdentity: string): Promise<string> {
    console.log('userID=>>>', userIdentity);
    return this.wyreService.createWyreUser(userIdentity);
  }

  @Post('user/kyc-details')
  @HttpCode(200)
  uploadKycDetails(@Body() body: WyreKycRequestPayload) {
    console.log(body.data);

    return this.wyreService.updateWyrePersonalDetails(body);
  }

  @Get('user/current-step')
  @HttpCode(200)
  getUserInformation(
    @Query('identity') userIdentity: string,
  ): Promise<WyreUser> {
    try {
      return this.wyreUserRepo.getUserByIdentity(userIdentity);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('user/get-ktc-step')
  @HttpCode(200)
  getUserKYCStep(@Query('identity') userIdentity: string): Promise<WyreUser> {
    try {
      return this.wyreUserRepo.getUserCurrentStep(userIdentity);
    } catch (error) {
      console.log(error);
    }
  }

  @Post('user/upload-documents')
  @HttpCode(200)
  uploadWyreDocuments(@Body() body: WyreUploadDocument): Promise<void> {
    return this.wyreService.uploadWyreDocument(body);
  }

  @Post('user/kyc-update')
  @HttpCode(200)
  updateKyc(@Body() body: WyreUpdateInformationDto): Promise<any> {
    return this.wyreService.updateWyreAccount(body);
  }

  @Post('user/create-payment')
  @HttpCode(200)
  createPaymentMethod(@Body() body: WyreCreatePaymentDto) {
    return this.wyreService.createWyrePaymentMethod(body);
  }

  @Get('user/payment-methods')
  @HttpCode(200)
  getPaymentMethods(@Query('identity') identity: string) {
    return this.wyreService.listWyrePaymentMethods(identity);
  }

  @Post('user/create-transfer-quote')
  @HttpCode(200)
  createTransferQuote(@Body() body: WyreCreateTransfer) {
    return this.wyreService.createTransferQuote(body);
  }

  @Post('user/confirm-transfer-quote')
  @HttpCode(200)
  confirmTransferQuote(@Body() body: WyreConfirmTransfer) {
    return this.wyreService.confirmTransferQuote(body);
  }

  @Get('user/kyc-info')
  @HttpCode(200)
  getWyreAccountInformation(@Query('identity') userIdentity: string) {
    return this.wyreService.getWyreAccountInformation(userIdentity);
  }

  @Get('user/account-status')
  @HttpCode(200)
  getAccountStatus(@Query('identity') userIdentity: string) {
    return this.wyreService.getAccountStatus(userIdentity);
  }

  @Get('plaid/link_token')
  @HttpCode(200)
  createLinkToken(): Promise<any> {
    return this.wyreService.createLinkToken();
  }
}
