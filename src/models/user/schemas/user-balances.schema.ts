import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserBalancesDocument = UserBalances & Document;

@Schema({ collection: 'user-balances' })
export class UserBalances {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  balances: string;

  @Prop({ required: true })
  created_date: string;
}

export const UserBalancesSchema = SchemaFactory.createForClass(UserBalances);
