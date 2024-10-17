import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  BaanxUserDto,
  BaanxUserKycDto,
  BaanxUserKycStatus,
  BaanxUserPassKycDto,
  BaanxUserSessionDto,
} from '../dto/baanx-user.dto';
import { BaanxUserService } from '../services/baanx-user.service';
import {
  BaanxUserResponse,
  BaanxUserSessionResponse,
} from '../models/baanx-user.model';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('baanx')
@Controller('baanx')
export class UserController {
  constructor(private readonly baanxUserService: BaanxUserService) {}

  @Post('user')
  @HttpCode(200)
  createUser(@Body() baanxUserDto: BaanxUserDto): Promise<BaanxUserResponse> {
    return this.baanxUserService.createUser(baanxUserDto);
  }

  @Post('user/session')
  @HttpCode(200)
  initUserSession(
    @Body() baanxUserSessionDto: BaanxUserSessionDto,
  ): Promise<BaanxUserSessionResponse> {
    return this.baanxUserService.initUserSession(baanxUserSessionDto);
  }

  @Post('user/kyc')
  @HttpCode(200)
  submitUserKyc(@Body() baanxUserKycDto: BaanxUserKycDto): Promise<void> {
    return this.baanxUserService.submitUserKyc(baanxUserKycDto);
  }

  @Post('user/kyc/pass')
  @HttpCode(200)
  userPassKyc(@Body() baanxUserPassKycDto: BaanxUserPassKycDto): Promise<void> {
    return this.baanxUserService.userPassKyc(baanxUserPassKycDto);
  }

  @Post('user/kyc/status')
  @HttpCode(200)
  userKycStatusUpdate(
    @Body() baanxUserKycStatus: BaanxUserKycStatus,
  ): Promise<void> {
    return this.baanxUserService.userKycStatusUpdate(baanxUserKycStatus);
  }
}
