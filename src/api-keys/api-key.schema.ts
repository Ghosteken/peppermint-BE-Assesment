import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/user.schema';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User | Types.ObjectId;

  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop()
  expiresAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
