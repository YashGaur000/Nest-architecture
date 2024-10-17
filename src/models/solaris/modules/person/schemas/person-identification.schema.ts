import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PersonIdentificationStatus } from '../enums/person.enums';

@Schema()
export class SolarisPersonIdentification {
  @Prop({ required: true })
  external_identification_id: string;

  @Prop({ required: true })
  status: PersonIdentificationStatus;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  reference: string;

  @Prop({ required: true })
  updated_date?: string;

  @Prop({ required: true })
  created_date?: string;
}

export const SolarisPersonIdentificationSchema = SchemaFactory.createForClass(
  SolarisPersonIdentification,
);
