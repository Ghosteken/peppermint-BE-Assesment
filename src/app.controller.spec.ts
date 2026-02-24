import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiKeyGuard } from './api-keys/guards/api-key.guard';
import { ApiKeyThrottlerGuard } from './api-keys/guards/api-key-throttler.guard';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiKeyThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getProtectedData', () => {
    it('should return protected data', () => {
      const mockReq = {
        user: { _id: 'user1' },
        apiKey: { _id: 'key1', name: 'test key' },
      };
      const result = appController.getProtectedData(mockReq);
      expect(result).toEqual({
        message: 'This data is protected by an API Key',
        user: mockReq.user,
        apiKey: {
          id: mockReq.apiKey._id,
          name: mockReq.apiKey.name,
        },
      });
    });
  });
});
