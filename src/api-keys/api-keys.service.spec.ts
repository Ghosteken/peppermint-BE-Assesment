import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './api-key.schema';
import { AccessLog } from './access-log.schema';
import { Types } from 'mongoose';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let model: any;

  const mockApiKey = {
    _id: new Types.ObjectId(),
    name: 'Test Key',
    key: 'test-key',
    user: new Types.ObjectId(),
    isRevoked: false,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockApiKeyModel = {
    new: jest.fn().mockResolvedValue(mockApiKey),
    constructor: jest.fn().mockResolvedValue(mockApiKey),
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  const mockAccessLogModel = {
    new: jest.fn(),
    constructor: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getModelToken(ApiKey.name),
          useValue: mockApiKeyModel,
        },
        {
          provide: getModelToken(AccessLog.name),
          useValue: mockAccessLogModel,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(3),
          },
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    model = module.get(getModelToken(ApiKey.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateKey', () => {
    it('should throw BadRequestException if user has reached max keys', async () => {
      const validUserId = new Types.ObjectId().toHexString();
      model.countDocuments.mockResolvedValue(3);
      await expect(service.generateKey(validUserId, 'New Key')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate a new key if under limit', async () => {
      const validUserId = new Types.ObjectId().toHexString();
      model.countDocuments.mockResolvedValue(1);

      // Mocking the constructor call
      const saveSpy = jest.fn().mockResolvedValue({ name: 'New Key' });
      function mockConstructor(dto: any) {
        return { ...dto, save: saveSpy };
      }
      (service as any).apiKeyModel = mockConstructor;
      (service as any).apiKeyModel.countDocuments = jest
        .fn()
        .mockResolvedValue(1);

      const result = await service.generateKey(validUserId, 'New Key');
      expect(result.name).toBe('New Key');
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('listKeys', () => {
    it('should list keys for a user', async () => {
      const userId = new Types.ObjectId().toHexString();
      const mockKeys = [{ name: 'Key 1' }];
      const execSpy = jest.fn().mockResolvedValue(mockKeys);
      const selectSpy = jest.fn().mockReturnValue({ exec: execSpy });
      model.find.mockReturnValue({ select: selectSpy });

      const result = await service.listKeys(userId);

      expect(result).toEqual(mockKeys);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('revokeKey', () => {
    it('should revoke an existing key', async () => {
      const userId = new Types.ObjectId().toHexString();
      const keyId = new Types.ObjectId().toHexString();
      const mockKey = {
        _id: keyId,
        user: userId,
        isRevoked: false,
        save: jest.fn().mockResolvedValue({ isRevoked: true }),
      };
      model.findOne.mockResolvedValue(mockKey);

      const result = await service.revokeKey(userId, keyId);

      expect(result.isRevoked).toBe(true);
    });

    it('should throw NotFoundException if key not found', async () => {
      model.findOne.mockResolvedValue(null);

      await expect(
        service.revokeKey(
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rotateKey', () => {
    it('should rotate an existing key', async () => {
      const userId = new Types.ObjectId().toHexString();
      const keyId = new Types.ObjectId().toHexString();
      const mockOldKey = {
        _id: keyId,
        user: userId,
        name: 'Old Key',
        isRevoked: false,
        save: jest.fn().mockResolvedValue(true),
      };
      model.findOne.mockResolvedValue(mockOldKey);

      // Mock generateKey
      const mockNewKey = { name: 'Old Key', key: 'new-key' };
      jest.spyOn(service, 'generateKey').mockResolvedValue(mockNewKey as any);

      const result = await service.rotateKey(userId, keyId);

      expect(result.oldKey.isRevoked).toBe(true);
      expect(result.newKey).toEqual(mockNewKey);
    });
  });
});
