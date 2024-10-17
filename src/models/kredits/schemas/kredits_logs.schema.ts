import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { timestamp } from 'aws-sdk/clients/cloudfront';
import { Document } from 'mongoose';

export type KreditsInfoLogDocument = KreditsInfoLog & Document;

@Schema({ collection: 'kredits-info-log' })
export class KreditsInfoLog {

  @Prop({required : true})
  identity : string;

  @Prop({ required: true })
  txType : string;

  @Prop({ required: true })
  timestamp : string;

  @Prop({ required: true })
  denom : string;

  @Prop({ required: true })
  amount : string;

  @Prop({ required: true })
  kredits : string;

  @Prop({required : true})
  walletAddress : string;

}

export const KreditsInfoLogSchema = SchemaFactory.createForClass(KreditsInfoLog);
