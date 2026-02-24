import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './api-key.schema';
import { AccessLog, AccessLogDocument } from './access-log.schema';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

@Injectable()
export class ApiKeysService {
  private readonly maxKeys: number;

  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(AccessLog.name)
    private accessLogModel: Model<AccessLogDocument>,
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
    private configService: ConfigService,
  ) {
    this.maxKeys = this.configService.get<number>('MAX_API_KEYS_PER_USER') || 3;
  }

  async generateKey(
    userId: string,
    name: string,
    ip?: string,
  ): Promise<ApiKeyDocument> {
    const activeKeysCount = await this.apiKeyModel.countDocuments({
      user: new Types.ObjectId(userId),
      isRevoked: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    } as any);

    if (activeKeysCount >= this.maxKeys) {
      throw new BadRequestException(
        `User cannot have more than ${this.maxKeys} active API keys`,
      );
    }

    const key = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Default 30 days expiration

    const apiKey = new this.apiKeyModel({
      user: new Types.ObjectId(userId),
      key,
      name,
      expiresAt,
    });

    const savedKey = await apiKey.save();

    await this.logAuditEvent(
      userId,
      'API_KEY_CREATED',
      { apiKeyId: savedKey._id, name },
      ip,
    );

    return savedKey;
  }

  async listKeys(userId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel

      .find({ user: new Types.ObjectId(userId) } as any)
      .select('-key')
      .exec();
  }

  async revokeKey(
    userId: string,
    keyId: string,
    ip?: string,
  ): Promise<ApiKeyDocument> {
    const apiKey = await this.apiKeyModel.findOne({
      _id: new Types.ObjectId(keyId),
      user: new Types.ObjectId(userId),
    } as any);

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    apiKey.isRevoked = true;
    const savedKey = await apiKey.save();

    await this.logAuditEvent(
      userId,
      'API_KEY_REVOKED',
      { apiKeyId: savedKey._id },
      ip,
    );

    return savedKey;
  }

  async rotateKey(
    userId: string,
    keyId: string,
    ip?: string,
  ): Promise<{ newKey: ApiKeyDocument; oldKey: ApiKeyDocument }> {
    const oldKey = await this.apiKeyModel.findOne({
      _id: new Types.ObjectId(keyId),
      user: new Types.ObjectId(userId),
      isRevoked: false,
    } as any);

    if (!oldKey) {
      throw new NotFoundException('Active API Key not found');
    }

    // Mark old key as revoked
    oldKey.isRevoked = true;
    await oldKey.save();

    // Create new key with same name
    const newKey = await this.generateKey(userId, oldKey.name, ip);

    await this.logAuditEvent(
      userId,
      'API_KEY_ROTATED',
      {
        oldKeyId: oldKey._id,
        newKeyId: newKey._id,
      },
      ip,
    );

    return { newKey, oldKey };
  }

  async validateKey(key: string): Promise<ApiKeyDocument | null> {
    const apiKey = await this.apiKeyModel
      .findOne({
        key,
        isRevoked: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      })
      .populate('user')
      .exec();

    return apiKey;
  }

  async logAccess(
    apiKeyId: string,
    endpoint: string,
    method: string,
    ipAddress: string,
    metadata?: Record<string, any>,
  ): Promise<AccessLogDocument> {
    const log = new this.accessLogModel({
      apiKey: new Types.ObjectId(apiKeyId),
      endpoint,
      method,
      ipAddress,
      metadata,
    });
    return log.save();
  }

  async logAuditEvent(
    userId: string,
    action: string,
    metadata?: Record<string, any>,
    ip?: string,
  ): Promise<AuditLogDocument> {
    const log = new this.auditLogModel({
      userId: new Types.ObjectId(userId),
      action,
      metadata,
      ip,
    });
    return log.save();
  }
}
