import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiKey } from './api-key.schema';

export type AccessLogDocument = AccessLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AccessLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ApiKey', required: true })
  apiKey: ApiKey | Types.ObjectId;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ type: Object })
  metadata: any;
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLog);
