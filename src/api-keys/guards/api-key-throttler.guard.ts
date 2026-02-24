import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use the API key as the tracker if available, otherwise fallback to IP
    return req.headers['x-api-key'] || req.ip;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest();

    // Only apply rate limiting if an API key is present
    if (request.headers['x-api-key']) {
      return super.handleRequest(requestProps);
    }

    return true;
  }
}
