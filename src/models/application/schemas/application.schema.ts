import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplicationSettingsDocument = ApplicationSettings & Document;

@Schema({ collection: 'application_settings' })
export class ApplicationSettings {
  @Prop({ required: true })
  app_id: string;

  @Prop({ required: true })
  maintenance: boolean;
}

export const ApplicationSettingsSchema =
  SchemaFactory.createForClass(ApplicationSettings);
