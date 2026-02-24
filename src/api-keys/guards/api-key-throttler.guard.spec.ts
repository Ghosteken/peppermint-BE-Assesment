import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyThrottlerGuard } from './api-key-throttler.guard';
import { ThrottlerModule } from '@nestjs/throttler';

describe('ApiKeyThrottlerGuard', () => {
  let guard: ApiKeyThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60,
            limit: 10,
          },
        ]),
      ],
      providers: [ApiKeyThrottlerGuard],
    }).compile();

    guard = module.get<ApiKeyThrottlerGuard>(ApiKeyThrottlerGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getTracker', () => {
    it('should use x-api-key as tracker if present', async () => {
      const req = { headers: { 'x-api-key': 'test-key' }, ip: '127.0.0.1' };
      const tracker = await guard['getTracker'](req);
      expect(tracker).toBe('test-key');
    });

    it('should fallback to ip if x-api-key is not present', async () => {
      const req = { headers: {}, ip: '127.0.0.1' };
      const tracker = await guard['getTracker'](req);
      expect(tracker).toBe('127.0.0.1');
    });
  });

  describe('handleRequest', () => {
    it('should skip rate limiting if no x-api-key header is present', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as any;

      const result = await guard['handleRequest']({
        context,
        limit: 10,
        ttl: 60,
        throttler: {} as any,
      } as any);
      expect(result).toBe(true);
    });
  });
});
