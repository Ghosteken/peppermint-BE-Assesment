import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  let service: any;

  const mockApiKeysService = {
    generateKey: jest.fn(),
    listKeys: jest.fn(),
    revokeKey: jest.fn(),
    rotateKey: jest.fn(),
  };

  const mockRequest = {
    ip: '127.0.0.1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should call service.generateKey with correct arguments', async () => {
      const userId = 'user123';
      const dto = { name: 'My Key' };
      await controller.generate(userId, dto, mockRequest as any);
      expect(service.generateKey).toHaveBeenCalledWith(
        userId,
        dto.name,
        mockRequest.ip,
      );
    });
  });

  describe('list', () => {
    it('should call service.listKeys', async () => {
      const userId = 'user123';
      await controller.list(userId);
      expect(service.listKeys).toHaveBeenCalledWith(userId);
    });
  });

  describe('revoke', () => {
    it('should call service.revokeKey', async () => {
      const userId = 'user123';
      const keyId = 'key123';
      await controller.revoke(userId, keyId, mockRequest as any);
      expect(service.revokeKey).toHaveBeenCalledWith(
        userId,
        keyId,
        mockRequest.ip,
      );
    });
  });

  describe('rotate', () => {
    it('should call service.rotateKey', async () => {
      const userId = 'user123';
      const keyId = 'key123';
      await controller.rotate(userId, keyId, mockRequest as any);
      expect(service.rotateKey).toHaveBeenCalledWith(
        userId,
        keyId,
        mockRequest.ip,
      );
    });
  });
});
