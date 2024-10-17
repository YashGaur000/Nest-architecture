import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaanxKycStatus } from '../common/enums';

export type BaanxUserDocument = BaanxUser & Document;

@Schema({ collection: 'baanx-users' })
export class BaanxUser {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  external_id: string;

  @Prop()
  kyc_status?: BaanxKycStatus;

  @Prop()
  kyc_request_id?: string;

  @Prop()
  kyc_reason?: string;

  @Prop()
  user_pass_kyc?: boolean;

  @Prop()
  updated_at?: string;
}

export const BaanxUserSchema = SchemaFactory.createForClass(BaanxUser);
