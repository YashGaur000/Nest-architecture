import { Module } from '@nestjs/common';
import { SolarisAuthModule } from '../auth/auth.module';
import { SolarisExternalDeviceBindingService } from './services/external-device-binding.service';
import { SolarisInternalDeviceBindingService } from './services/internal-device-binding.service';
import { SolarisPersonModule } from '../person/person.module';
import { HttpModule } from '@nestjs/axios';
import { SolarisDeviceBindingController } from './controllers/device-binding.controller';
import { SolarisGCloudKmsService } from './services/g-cloud-kms.service';

@Module({
  imports: [
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    SolarisAuthModule,
    SolarisPersonModule,
  ],
  providers: [
    SolarisGCloudKmsService,
    SolarisExternalDeviceBindingService,
    SolarisInternalDeviceBindingService,
  ],
  controllers: [SolarisDeviceBindingController],
})
export class SolarisDeviceBindingModule {}
