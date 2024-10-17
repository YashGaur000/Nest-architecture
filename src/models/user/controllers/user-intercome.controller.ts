import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UserIntercomService } from '../services/user-intercom.service';
import { UserEmailDto } from '../dto/user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  INTERCOM_TAG_ACCOUNT_FEATURE_INFO,
  INTERCOM_TAG_ONBOARDING_COMPLETE,
  INTERCOM_TAG_TOKEN_ANIMATION,
} from '../../../environments';

@ApiTags('users')
@Controller('user')
export class UserIntercomeController {
  constructor(private readonly userIntercomService: UserIntercomService) {}

  @Post('onboarding')
  @HttpCode(201)
  async isUserPassOnboarding(@Body() userEmailDto: UserEmailDto) {
    const user = await this.userIntercomService.isUserHasTag(
      userEmailDto.email,
      INTERCOM_TAG_ONBOARDING_COMPLETE,
    );
    if (!user) {
      throw new HttpException(
        'User not passed onboarding flow',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('onboarding/passed')
  @HttpCode(201)
  async userPassedOnboarding(@Body() userEmailDto: UserEmailDto) {
    return this.userIntercomService.addTagToUser(
      userEmailDto.email,
      INTERCOM_TAG_ONBOARDING_COMPLETE,
    );
  }

  @Post('account-features')
  @HttpCode(201)
  async isUserViewAccountFeatures(@Body() userEmailDto: UserEmailDto) {
    const user = await this.userIntercomService.isUserHasTag(
      userEmailDto.email,
      INTERCOM_TAG_ACCOUNT_FEATURE_INFO,
    );
    if (!user) {
      throw new HttpException(
        'Not pass account features',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('account-features/passed')
  @HttpCode(201)
  async userViewedAccountFeatures(@Body() userEmailDto: UserEmailDto) {
    return this.userIntercomService.addTagToUser(
      userEmailDto.email,
      INTERCOM_TAG_ACCOUNT_FEATURE_INFO,
    );
  }

  @Post('rewards')
  @HttpCode(201)
  async isUserPassRewards(@Body() userEmailDto: UserEmailDto) {
    const user = await this.userIntercomService.isUserHasTag(
      userEmailDto.email,
      INTERCOM_TAG_TOKEN_ANIMATION,
    );
    if (!user) {
      throw new HttpException(
        'User not passed rewards flow',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('rewards/passed')
  @HttpCode(201)
  async userPassedRewards(@Body() userEmailDto: UserEmailDto) {
    return this.userIntercomService.addTagToUser(
      userEmailDto.email,
      INTERCOM_TAG_TOKEN_ANIMATION,
    );
  }

  @Post('kash-credits')
  @HttpCode(201)
  async getKashCreditsCount(@Body() userEmailDto: UserEmailDto) {
    return this.userIntercomService.getKashCreditsCount(userEmailDto.email);
  }

  @Post('investment-restrictions')
  @HttpCode(201)
  async getLocation(@Body() userEmailDto: UserEmailDto) {
    return this.userIntercomService.investmentRestrictions(userEmailDto.email);
  }

  @Get('total')
  async getTotalUsersCount(): Promise<{ total: number }> {
    return this.userIntercomService.getTotalUsersCount();
  }
}
