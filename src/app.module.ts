import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './models/user/user.module';
import { KreditsInfoModule } from './models/kredits/kredits-info.module';
import { TwoFactorAuthenticationModule } from './models/two-factor-authentication/two-factor-authentication.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGODB_URL } from './environments';
import { BaanxModule } from './models/baanx/baanx.module';
import { TradeTransactionModule } from './models/trade-transaction/trade-transaction.module';
import { ApplicationModule } from './models/application/application.module';
import { NewsapiModule } from './models/newsapi/newsapi.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WyreIntegrationModule } from './models/wyre-integration/wyre-integration.module';
import { PrimeTrustIntegrationModule } from './models/prime-trust-integration/prime-trust-integration.module';
import { PrivateMemoModule } from './models/private-memo/private-memo.module';
import { SolarisModule } from './models/solaris/solaris.module';

@Module({
  imports: [
    UserModule,
    BaanxModule,
    SolarisModule,
    NewsapiModule,
    ApplicationModule,
    KreditsInfoModule,
    TradeTransactionModule,
    WyreIntegrationModule,
    TwoFactorAuthenticationModule,
    PrimeTrustIntegrationModule,
    PrivateMemoModule,
    MongooseModule.forRoot(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
