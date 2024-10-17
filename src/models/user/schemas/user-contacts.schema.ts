import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserContactsDocument = UserContacts & Document;

@Schema({ collection: 'user-contacts' })
export class UserContacts {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: true })
  contact: string;

  @Prop({ required: true })
  updated_date: string;

  @Prop({ required: true })
  created_date: string;
}

export const UserContactsSchema = SchemaFactory.createForClass(UserContacts);
