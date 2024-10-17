import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserIntercomeController } from './controllers/user-intercome.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserIntercomService } from './services/user-intercom.service';
import { IntercomService } from './services/intercom.service';
import { User, UserSchema } from './schemas/user.schema';
import { UserProfileService } from './services/user-profile.service';
import { UserController } from './controllers/user.controller';
import { AccountBalancesService } from './services/account-balances-service';
import { UserBalancesJobService } from './services/user-balances-job.service';
import {
  UserBalances,
  UserBalancesSchema,
} from './schemas/user-balances.schema';
import {
  UserContacts,
  UserContactsSchema,
} from './schemas/user-contacts.schema';
import { UserContactsService } from './services/user-contacts.service';
import { UserContactsController } from './controllers/user-contacts.controller';
import { PrimeTrustIntegrationModule } from '../prime-trust-integration/prime-trust-integration.module';

@Module({
  imports: [
    forwardRef(() => PrimeTrustIntegrationModule),
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserBalances.name, schema: UserBalancesSchema },
      { name: UserContacts.name, schema: UserContactsSchema },
    ]),
  ],
  controllers: [
    UserIntercomeController,
    UserController,
    UserContactsController,
  ],
  providers: [
    UserIntercomService,
    UserProfileService,
    IntercomService,
    AccountBalancesService,
    UserBalancesJobService,
    UserContactsService,
  ],
  exports: [UserProfileService, UserIntercomService],
})
export class UserModule {}
