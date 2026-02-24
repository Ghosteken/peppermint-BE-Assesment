import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey, ApiKeySchema } from './api-key.schema';
import { AccessLog, AccessLogSchema } from './access-log.schema';
import { AuditLog, AuditLogSchema } from './audit-log.schema';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: AccessLog.name, schema: AccessLogSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [ApiKeysService],
  controllers: [ApiKeysController],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
