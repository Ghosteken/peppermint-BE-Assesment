import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];

    if (!key) {
      throw new UnauthorizedException('API Key is missing');
    }

    const apiKey = await this.apiKeysService.validateKey(key);
    if (!apiKey) {
      throw new UnauthorizedException('Invalid or expired API Key');
    }

    // Log the access
    await this.apiKeysService.logAccess(
      apiKey._id.toString(),
      request.url,
      request.method,
      request.ip,
      { userAgent: request.headers['user-agent'] },
    );

    request.user = apiKey.user;
    request.apiKey = apiKey;

    return true;
  }
}
