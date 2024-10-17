import { forwardRef, Module } from '@nestjs/common';
import { SolarisAuthModule } from '../auth/auth.module';
import { SolarisPersonModule } from '../person/person.module';
import { HttpModule } from '@nestjs/axios';
import { SolarisInternalAccountsService } from './services/internal-accounts.service';
import { SolarisExternalAccountService } from './services/external-accounts.service';
import { SolarisAccountsController } from './controllers/accounts.controller';
import { SolarisCardsController } from './controllers/cards.controller';
import { SolarisInternalCardsService } from './services/internal-cards.service';
import { SolarisExternalCardsService } from './services/external-cards.service';

@Module({
  imports: [
    forwardRef(() => SolarisPersonModule),
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    SolarisAuthModule,
  ],
  providers: [
    SolarisExternalAccountService,
    SolarisInternalAccountsService,
    SolarisExternalCardsService,
    SolarisInternalCardsService,
  ],
  controllers: [SolarisAccountsController, SolarisCardsController],
  exports: [SolarisInternalAccountsService],
})
export class SolarisAccountsModule {}
