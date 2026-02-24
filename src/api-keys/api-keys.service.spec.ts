import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './api-key.schema';
import { AccessLog } from './access-log.schema';
import { AuditLog } from './audit-log.schema';
import { Types } from 'mongoose';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let model: any;
  let logAuditEventSpy: jest.SpyInstance;

  const mockApiKey = {
    _id: new Types.ObjectId(),
    name: 'Test Key',
    key: 'test-key',
    user: new Types.ObjectId(),
    isRevoked: false,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockApiKeyModel {
    save: any;
    constructor(private data: any) {
      this.save = jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ ...this.data, _id: new Types.ObjectId() }),
        );
    }
    static find = jest.fn();
    static findOne = jest.fn();
    static countDocuments = jest.fn();
    static create = jest.fn();
    static exec = jest.fn();
  }

  class MockAccessLogModel {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  class MockAuditLogModel {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getModelToken(ApiKey.name),
          useValue: MockApiKeyModel,
        },
        {
          provide: getModelToken(AccessLog.name),
          useValue: MockAccessLogModel,
        },
        {
          provide: getModelToken(AuditLog.name),
          useValue: MockAuditLogModel,
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

    logAuditEventSpy = jest
      .spyOn(service, 'logAuditEvent')
      .mockResolvedValue({} as any);
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

      const saveSpy = jest
        .fn()
        .mockResolvedValue({ _id: new Types.ObjectId(), name: 'New Key' });
      function mockConstructor(dto: any) {
        return { ...dto, save: saveSpy, _id: new Types.ObjectId() };
      }
      (service as any).apiKeyModel = mockConstructor;
      (service as any).apiKeyModel.countDocuments = jest
        .fn()
        .mockResolvedValue(1);

      const result = await service.generateKey(
        validUserId,
        'New Key',
        '127.0.0.1',
      );
      expect(result.name).toBe('New Key');
      expect(saveSpy).toHaveBeenCalled();
      expect(logAuditEventSpy).toHaveBeenCalledWith(
        validUserId,
        'API_KEY_CREATED',
        expect.any(Object),
        '127.0.0.1',
      );
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
        save: jest.fn().mockResolvedValue({ _id: keyId, isRevoked: true }),
      };
      model.findOne.mockResolvedValue(mockKey);

      const result = await service.revokeKey(userId, keyId, '127.0.0.1');
      expect(result.isRevoked).toBe(true);
      expect(logAuditEventSpy).toHaveBeenCalledWith(
        userId,
        'API_KEY_REVOKED',
        { apiKeyId: keyId },
        '127.0.0.1',
      );
    });

    it('should throw NotFoundException if key not found', async () => {
      model.findOne.mockResolvedValue(null);
      await expect(
        service.revokeKey(
          new Types.ObjectId().toHexString(),
          new Types.ObjectId().toHexString(),
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

      const mockNewKey = {
        _id: new Types.ObjectId(),
        name: 'Old Key',
        key: 'new-key',
      };
      jest.spyOn(service, 'generateKey').mockResolvedValue(mockNewKey as any);

      const result = await service.rotateKey(userId, keyId, '127.0.0.1');
      expect(result.oldKey.isRevoked).toBe(true);
      expect(result.newKey).toEqual(mockNewKey);
      expect(logAuditEventSpy).toHaveBeenCalledWith(
        userId,
        'API_KEY_ROTATED',
        expect.any(Object),
        '127.0.0.1',
      );
    });
  });

  describe('validateKey', () => {
    it('should return a key if valid', async () => {
      const mockKey = {
        ...mockApiKey,
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockApiKey),
      };
      model.findOne.mockReturnValue(mockKey);

      const result = await service.validateKey('test-key');
      expect(result).toBe(mockApiKey);
    });
  });

  describe('logAccess', () => {
    it('should save an access log', async () => {
      const apiKeyId = new Types.ObjectId().toHexString();
      const saveSpy = jest.fn().mockResolvedValue({ success: true });
      (service as any).accessLogModel = jest
        .fn()
        .mockImplementation(() => ({ save: saveSpy }));

      await service.logAccess(apiKeyId, '/test', 'GET', '127.0.0.1', {
        ua: 'test',
      });
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('logAuditEvent', () => {
    it('should save an audit log', async () => {
      const userId = new Types.ObjectId().toHexString();
      const saveSpy = jest.fn().mockResolvedValue({ success: true });

      jest.restoreAllMocks();
      (service as any).auditLogModel = jest
        .fn()
        .mockImplementation(() => ({ save: saveSpy }));

      await service.logAuditEvent(
        userId,
        'TEST_ACTION',
        { foo: 'bar' },
        '127.0.0.1',
      );
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
