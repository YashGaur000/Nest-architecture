import { Global, Module } from '@nestjs/common';
import { SolarisPersonModule } from './modules/person/person.module';
import { SolarisDeviceBindingModule } from './modules/device-binding/device-binding.module';
import { SolarisAccountsModule } from './modules/accounts/accounts.module';

@Global()
@Module({
  imports: [
    SolarisPersonModule,
    SolarisDeviceBindingModule,
    SolarisAccountsModule,
  ],
})
export class SolarisModule {}
