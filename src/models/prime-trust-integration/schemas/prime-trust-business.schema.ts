import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrimeTrustBusinessUserDocument = PrimeTrustBusinessUser & Document;

@Schema({ collection: 'prime-trust-business-users' })
export class PrimeTrustBusinessUser {
  @Prop({ required: true })
  identity: string;

  @Prop({ required: false })
  kyc_initiated: boolean;

  @Prop()
  account_id?: string;

  @Prop()
  contact_id?: string;

  @Prop({ required: false })
  updated_at?: string;

  @Prop({ required: false })
  document_ids?: string[];

  @Prop({ required: false })
  related_contacts?: RelatedContacts[];

  @Prop({ required: false })
  current_kyc_step?: string;

  @Prop({ required: false })
  wire_transfer_method_id?: string;

  @Prop({ required: false })
  connected_banks?: PrimeTrustUserBank[];
}

/* TODO We can store the KYC Document Check ID over here. Card Holder Object ID, Card Holder Verification Object ID(returned from the post API of Card Holder Object)*/
export interface PrimeTrustUserBank {
  bank_name: string;
  funds_transfer_method_id: string;
  active: boolean;
  bank_account_type: string;
}

export interface RelatedContacts {
  contact_id: string;
  document_ids?: string[];
}

export const PrimeTrustBusinessUserSchema = SchemaFactory.createForClass(
  PrimeTrustBusinessUser,
);
