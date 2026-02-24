import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiKeyGuard } from './api-keys/guards/api-key.guard';
import { ApiKeyThrottlerGuard } from './api-keys/guards/api-key-throttler.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('protected-data')
  @UseGuards(ApiKeyGuard, ApiKeyThrottlerGuard)
  getProtectedData(@Request() req: any) {
    return {
      message: 'This data is protected by an API Key',
      user: req.user,
      apiKey: {
        id: req.apiKey._id,
        name: req.apiKey.name,
      },
    };
  }
}
