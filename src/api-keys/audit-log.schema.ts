import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // e.g., 'API_KEY_CREATED', 'API_KEY_REVOKED', 'API_KEY_ROTATED'

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ip: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
