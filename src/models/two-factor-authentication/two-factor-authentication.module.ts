import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TwoFactorAuthenticationController } from './two-factor-authentication.controller';
import { TwoFactorAuthenticationService } from './two-factor-authentication.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
  ],
  controllers: [TwoFactorAuthenticationController],
  providers: [TwoFactorAuthenticationService],
})
export class TwoFactorAuthenticationModule {}
