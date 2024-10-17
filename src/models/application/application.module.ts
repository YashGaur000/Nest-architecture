import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationController } from './application.controller';
import {
  ApplicationSettingsSchema,
  ApplicationSettings,
} from './schemas/application.schema';
import { ApplicationService } from './application.service';
import { ApplicationGateway } from './application.gateway';

@Module({
  imports: [
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    MongooseModule.forFeature([
      { name: ApplicationSettings.name, schema: ApplicationSettingsSchema },
    ]),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationGateway],
})
export class ApplicationModule {}
