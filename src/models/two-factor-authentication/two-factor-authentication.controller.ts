import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { TwoFactorAuthenticationService } from './two-factor-authentication.service';
import {
  TwoFASendDto,
  TwoFAVerifyDto,
} from './dto/two-factor-authentication.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('2fa')
@Controller('2fa')
export class TwoFactorAuthenticationController {
  constructor(
    private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
  ) {}

  @Post('send')
  @HttpCode(200)
  async send(@Body() twoFASendDto: TwoFASendDto) {
    await this.twoFactorAuthenticationService.send(twoFASendDto.email);
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() twoFAVerifyDto: TwoFAVerifyDto) {
    const status = await this.twoFactorAuthenticationService.verify(
      twoFAVerifyDto.code,
      twoFAVerifyDto.email,
    );
    if (status === 'approved') {
      return true;
    } else {
      throw new HttpException('Verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('required')
  @HttpCode(200)
  async is2FARequired(@Body() twoFASendDto: TwoFASendDto) {
    return this.twoFactorAuthenticationService.is2FARequired(
      twoFASendDto.email,
    );
  }
}
