import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TxLogDocument = TradeTransactionLog & Document;

@Schema({ collection: 'trade-transaction-log' })
export class TradeTransactionLog {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  tx_data: string;

  @Prop({ required: true })
  created_date: string;
}

export const TradeTransactionLogSchema =
  SchemaFactory.createForClass(TradeTransactionLog);
