import { forwardRef, Module } from '@nestjs/common';
import { PrimeTrustIntegrationService } from './services/prime-trust-integration.service';
import { PrimeTrustTransfersService } from './services/prime-trust-transfers.service';
import { PrimeTrustController } from './prime-trust.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import {
  PrimeTrustUser,
  PrimeTrustUserSchema,
} from './schemas/prime-trust-user.schema';
import { UserModule } from '../user/user.module';
import { PrimeTrustUserRepository } from './repositories/prime-trust-user.repository';
import { PrimeTrustPlaidService } from './services/prime-trust-plaid.service';
import { PrimeTrustCardService } from './services/prime-trust-card.service';
import { PrimeTrustCommonService } from './services/prime-trust-common.service';
import {
  PrimeTrustBusinessUser,
  PrimeTrustBusinessUserSchema,
} from './schemas/prime-trust-business.schema';
import { PrimeTrustBusinessUserRepository } from './repositories/prime-trust-business-user.repository';
import { PrimeTrustJwtJobService } from './services/prime-trust-jwt-job.service';
import { PrimeTrustJwtService } from './services/prime-trust-jwt.service';

@Module({
  controllers: [PrimeTrustController],
  providers: [
    PrimeTrustIntegrationService,
    PrimeTrustTransfersService,
    PrimeTrustBusinessUserRepository,
    PrimeTrustUserRepository,
    PrimeTrustPlaidService,
    PrimeTrustCardService,
    PrimeTrustCommonService,
    PrimeTrustJwtJobService,
    PrimeTrustJwtService,
  ],
  imports: [
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    MongooseModule.forFeature([
      { name: PrimeTrustUser.name, schema: PrimeTrustUserSchema },
      {
        name: PrimeTrustBusinessUser.name,
        schema: PrimeTrustBusinessUserSchema,
      },
    ]),
    forwardRef(() => UserModule),
  ],
  exports: [
    PrimeTrustUserRepository,
    PrimeTrustBusinessUserRepository,
    PrimeTrustCommonService,
    PrimeTrustTransfersService,
  ],
})
export class PrimeTrustIntegrationModule {}
