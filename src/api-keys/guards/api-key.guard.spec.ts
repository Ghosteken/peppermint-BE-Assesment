import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysService } from '../api-keys.service';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let service: any;

  const mockApiKeysService = {
    validateKey: jest.fn(),
    logAccess: jest.fn(),
  };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: { 'x-api-key': 'test-key', 'user-agent': 'test-ua' },
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1',
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and set user/apiKey on request if key is valid', async () => {
      const mockApiKey = { _id: 'keyid', user: 'userid' };
      service.validateKey.mockResolvedValue(mockApiKey);
      service.logAccess.mockResolvedValue({});

      const request = mockContext.switchToHttp().getRequest();
      const result = await guard.canActivate(
        mockContext as unknown as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(request.user).toBe(mockApiKey.user);
      expect(request.apiKey).toBe(mockApiKey);
      expect(service.logAccess).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if key is missing', async () => {
      const mockContextNoKey = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ headers: {} }),
        }),
      };

      await expect(
        guard.canActivate(mockContextNoKey as unknown as ExecutionContext),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if key is invalid', async () => {
      service.validateKey.mockResolvedValue(null);
      await expect(
        guard.canActivate(mockContext as unknown as ExecutionContext),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
