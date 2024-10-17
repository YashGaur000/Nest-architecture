import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WyreApiSteps } from '../enums/wyre.enum';

export type WyreUserDocument = WyreUser & Document;

@Schema({collection: 'wyre-users'})
export class WyreUser {
  @Prop({required: true})
  identity?: string;

  @Prop({required: true})
  secret_key?: string;

  @Prop({required: false})
  current_kyc_step?: WyreApiSteps;

  @Prop({required: false})
  account_id?: string;
}

export const WyreUserSchema = SchemaFactory.createForClass(WyreUser);
