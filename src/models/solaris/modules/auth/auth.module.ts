import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SolarisAuthService } from './services/solaris-auth.service';

@Module({
  imports: [
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
  ],
  providers: [SolarisAuthService],
  exports: [SolarisAuthService],
})
export class SolarisAuthModule {}
