import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { WyreUserRepository } from './repositories/wyre-user.repository';
import { WyreUser, WyreUserSchema } from './schemas/wyre-user.schema';
import { WyrePlaidService } from './services/wyre-plaid.service';
import { WyreIntegrationController } from './wyre-integration.controller';

@Module({
  controllers: [WyreIntegrationController],
  providers: [WyrePlaidService, WyreUserRepository],
  imports: [
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    MongooseModule.forFeature([
      { name: WyreUser.name, schema: WyreUserSchema },
    ]),
    UserModule,
  ],
})
export class WyreIntegrationModule {}
