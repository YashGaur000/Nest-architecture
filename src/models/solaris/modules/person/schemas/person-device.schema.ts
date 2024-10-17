import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class SolarisPersonDevice {
  @Prop()
  external_device_id?: string;

  @Prop({ required: true })
  restricted_key_id?: string;

  @Prop()
  unrestricted_key_id?: string;

  @Prop()
  restricted_key_verified?: boolean;

  @Prop()
  unrestricted_key_verified?: boolean;

  @Prop({ required: true })
  created_date?: string;
}
export const SolarisPersonDeviceSchema =
  SchemaFactory.createForClass(SolarisPersonDevice);
