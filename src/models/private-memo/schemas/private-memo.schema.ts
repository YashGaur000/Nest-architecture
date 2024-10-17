import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrivetMemoDocument = PrivetMemo & Document;

@Schema({ collection: 'private-memos' })
export class PrivetMemo {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  tx_hash: string;

  @Prop({ required: true })
  memo: string;

  @Prop({ required: true })
  tx_type: string;

  @Prop({ required: true })
  updated_date: string;

  @Prop({ required: true })
  created_date: string;
}

export const PrivateMemoSchema = SchemaFactory.createForClass(PrivetMemo);
