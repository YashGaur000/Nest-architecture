import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, Put } from '@nestjs/common';
import { BindDeviceDto } from '../dto/bind-device.dto';
import { SolarisInternalDeviceBindingService } from '../services/internal-device-binding.service';
import { DeviceSignatureDto } from '../dto/device-signature.dto';
import { AddKeyDeviceDto } from '../dto/add-key-device.dto';
import { BindDeviceResponse } from '../intefaces/device-binding.interfaces';

@ApiTags('Solaris -> devices')
@Controller('solaris/devices')
export class SolarisDeviceBindingController {
  constructor(
    private readonly solarisInternalDeviceBindingService: SolarisInternalDeviceBindingService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Bind Device',
  })
  bindDevice(
    @Body() bindDeviceDto: BindDeviceDto,
  ): Promise<BindDeviceResponse> {
    return this.solarisInternalDeviceBindingService.bindDevice(bindDeviceDto);
  }

  @Put()
  @ApiCreatedResponse({
    description: 'Add unrestricted key to Device',
  })
  addUnrestrictedKeyToDevice(
    @Body() addKeyDeviceDto: AddKeyDeviceDto,
  ): Promise<void> {
    return this.solarisInternalDeviceBindingService.addUnrestrictedKeyToDevice(
      addKeyDeviceDto,
    );
  }

  @Post('sign')
  @ApiCreatedResponse({
    description: 'Sign and Verify the Device',
  })
  signature(@Body() deviceSignatureDto: DeviceSignatureDto): Promise<void> {
    return this.solarisInternalDeviceBindingService.signature(
      deviceSignatureDto,
    );
  }
}
