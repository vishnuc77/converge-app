import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Wallet {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true })
  encryptedPrivateKey: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, unique: true })
  appwriteUserId: string;
}

export type WalletDocument = Wallet & Document;
export const WalletSchema = SchemaFactory.createForClass(Wallet); 