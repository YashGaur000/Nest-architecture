import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KreditsInfoDocument = KreditsInfo & Document;

@Schema({ collection: 'kredits-info' })
export class KreditsInfo {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  kredits: string;

  @Prop({ required: true })
  totalKredits: string;

  @Prop()
  referKredits: string;

  @Prop()
  depositKredits: string;

  @Prop({ required: true })
  tier: string;

  @Prop()
  referrer: string;

  @Prop()
  referralStatus: boolean;

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  referral_code: string;

  @Prop({ required: true })
  latest_updated_date: string;

  @Prop()
  tier_expiration_date? : string;
}

export const KreditsInfoSchema = SchemaFactory.createForClass(KreditsInfo);
