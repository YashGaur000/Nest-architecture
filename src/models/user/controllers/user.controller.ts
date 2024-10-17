import { Body, Controller, HttpCode, Patch, Post } from '@nestjs/common';
import { UserProfileService } from '../services/user-profile.service';
import { UserInitDto } from '../dto/user-init.dto';
import {
  UserBalanceStatistic,
  UserPersonalInfo,
} from '../common/user-interfaces';
import { UserUpdateDto } from '../dto/user-update.dto';
import { UserBalanceStatisticsDto, UserIdentityDto } from '../dto/user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('user/me')
export class UserController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post()
  @HttpCode(201)
  initUser(@Body() userInitDto: UserInitDto): Promise<void> {
    return this.userProfileService.initUser(userInitDto);
  }

  @Post('get')
  getUser(@Body() userIdentityDto: UserIdentityDto): Promise<UserPersonalInfo> {
    return this.userProfileService.getUserPersonalInfo(
      userIdentityDto.identity,
    );
  }

  @Patch('update')
  updateUser(@Body() userUpdateDto: UserUpdateDto) {
    return this.userProfileService.updateUserPersonalInfo(
      userUpdateDto.identity,
      userUpdateDto,
    );
  }

  @Post('balance/statistics')
  @HttpCode(200)
  getBalances(
    @Body() userBalanceStatisticsDto: UserBalanceStatisticsDto,
  ): Promise<UserBalanceStatistic[]> {
    return this.userProfileService.getUserBalances(
      userBalanceStatisticsDto.identity,
      userBalanceStatisticsDto.range,
    );
  }
}
