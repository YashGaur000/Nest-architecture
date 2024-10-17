import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users' })
export class User {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  terra_wallet_address: string;

  @Prop({ required: true })
  ethereum_wallet_address: string;

  @Prop()
  baanx_external_id?: string;

  @Prop()
  intercome_id: string;

  @Prop()
  referral_code?: string;

  @Prop()
  last_logged_in?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
