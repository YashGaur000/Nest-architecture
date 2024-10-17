import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceKeyType } from '../enums/device.enums';

export class DeviceSignatureDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  identity: string;

  @IsNotEmpty()
  @ApiProperty({ type: String })
  otp: string;

  @IsNotEmpty()
  @ApiProperty({ enum: DeviceKeyType })
  key_type: DeviceKeyType;

  @IsNotEmpty()
  @ApiProperty({ type: String })
  challenge_id: string;
}
