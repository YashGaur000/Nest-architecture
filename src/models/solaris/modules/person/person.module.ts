import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SolarisInternalPerson,
  SolarisPersonSchema,
} from './schemas/person.schema';
import { SolarisPersonRepository } from './repositories/persons.repository';
import { SolarisInternalPersonsService } from './services/internal-persons.service';
import { SolarisExternalPersonsService } from './services/external-persons.service';
import { SolarisPersonsController } from './controllers/persons.controller';
import { HttpModule } from '@nestjs/axios';
import { SolarisAuthModule } from '../auth/auth.module';
import { UserModule } from '../../../user/user.module';
import { SolarisPersonsWebhooksController } from './controllers/persons-webhooks.controller';
import { PersonsWebhooksService } from './services/persons-webhooks.service';
import { SolarisAccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SolarisInternalPerson.name, schema: SolarisPersonSchema },
    ]),
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    UserModule,
    SolarisAuthModule,
    SolarisAccountsModule,
  ],
  providers: [
    PersonsWebhooksService,
    SolarisPersonRepository,
    SolarisInternalPersonsService,
    SolarisExternalPersonsService,
  ],
  exports: [
    SolarisInternalPersonsService,
    SolarisPersonRepository,
    SolarisExternalPersonsService,
  ],
  controllers: [SolarisPersonsController, SolarisPersonsWebhooksController],
})
export class SolarisPersonModule {}
