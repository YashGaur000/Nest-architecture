import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrimeTrustUserDocument = PrimeTrustUser & Document;

@Schema()
export class AssetTransferInformation {
  wallet_address: string;
  memo: string;
}
@Schema({ collection: 'prime-trust-users' })
export class PrimeTrustUser {
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
  proof_of_address?: boolean = false;

  @Prop({ required: false })
  current_kyc_step?: string;

  @Prop({ required: false })
  card_verification_id?: string;

  @Prop({ required: false })
  card_object_id?: string;

  @Prop({ required: false })
  card_status?: string;

  @Prop({ required: false })
  card_id?: string;

  @Prop({ required: false })
  push_transfer_method_id?: string;

  @Prop({ required: false })
  asset_transfer_info?: AssetTransferInformation;
  
  @Prop({ required: false })
  wire_transfer_method_id?: string;

  @Prop({ required: false })
  connected_banks?: Array<PrimeTrustUserBank>;
}

/* TODO We can store the KYC Document Check ID over here. Card Holder Object ID, Card Holder Verification Object ID(returned from the post API of Card Holder Object)*/
export interface PrimeTrustUserBank {
  bank_name: string;
  funds_transfer_method_id: string;
  active: boolean;
  bank_account_type: string;
}


export const PrimeTrustUserSchema =
  SchemaFactory.createForClass(PrimeTrustUser);
