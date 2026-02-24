import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './api-key.schema';
import { AccessLog, AccessLogDocument } from './access-log.schema';

@Injectable()
export class ApiKeysService {
  private readonly maxKeys: number;

  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(AccessLog.name)
    private accessLogModel: Model<AccessLogDocument>,
    private configService: ConfigService,
  ) {
    this.maxKeys = this.configService.get<number>('MAX_API_KEYS_PER_USER') || 3;
  }

  async generateKey(userId: string, name: string): Promise<ApiKeyDocument> {
    const activeKeysCount = await this.apiKeyModel.countDocuments({
      user: new Types.ObjectId(userId),
      isRevoked: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

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

    return apiKey.save();
  }

  async listKeys(userId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find({ user: new Types.ObjectId(userId) })
      .select('-key')
      .exec();
  }

  async revokeKey(userId: string, keyId: string): Promise<ApiKeyDocument> {
    const apiKey = await this.apiKeyModel.findOne({
      _id: new Types.ObjectId(keyId),
      user: new Types.ObjectId(userId),
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    apiKey.isRevoked = true;
    return apiKey.save();
  }

  async rotateKey(
    userId: string,
    keyId: string,
  ): Promise<{ newKey: ApiKeyDocument; oldKey: ApiKeyDocument }> {
    const oldKey = await this.apiKeyModel.findOne({
      _id: new Types.ObjectId(keyId),
      user: new Types.ObjectId(userId),
      isRevoked: false,
    });

    if (!oldKey) {
      throw new NotFoundException('Active API Key not found');
    }

    // Mark old key as revoked
    oldKey.isRevoked = true;
    await oldKey.save();

    // Create new key with same name
    const newKey = await this.generateKey(userId, oldKey.name);

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
    metadata?: any,
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
}
