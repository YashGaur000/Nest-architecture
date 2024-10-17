import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  SolarisPersonDevice,
  SolarisPersonDeviceSchema,
} from './person-device.schema';
import {
  SolarisPersonIdentification,
  SolarisPersonIdentificationSchema,
} from './person-identification.schema';
import { CardTypeEnum } from '../../accounts/enums/cards.enums';

export type SolarisPersonDocument = SolarisInternalPerson & Document;

@Schema({ collection: 'solaris-users' })
export class SolarisInternalPerson {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  person_id: string;

  @Prop()
  account_id?: string;

  @Prop()
  tax_identification?: string;

  @Prop()
  account_approved: boolean;

  @Prop({ required: true })
  pre_order_card_type: CardTypeEnum;

  @Prop(SolarisPersonIdentificationSchema)
  identifications?: SolarisPersonIdentification;

  @Prop(SolarisPersonDeviceSchema)
  device?: SolarisPersonDevice;

  @Prop({ required: true })
  updated_date?: string;

  @Prop({ required: true })
  created_date?: string;
}

export const SolarisPersonSchema = SchemaFactory.createForClass(
  SolarisInternalPerson,
);
