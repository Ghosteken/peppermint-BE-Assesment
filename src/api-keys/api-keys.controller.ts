import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Param,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  async generate(
    @GetUser('userId') userId: string,
    @Body() dto: CreateApiKeyDto,
    @Request() req: any,
  ) {
    return this.apiKeysService.generateKey(userId, dto.name, req.ip);
  }

  @Get()
  async list(@GetUser('userId') userId: string) {
    return this.apiKeysService.listKeys(userId);
  }

  @Delete(':id')
  async revoke(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.apiKeysService.revokeKey(userId, id, req.ip);
  }

  @Patch(':id/rotate')
  async rotate(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.apiKeysService.rotateKey(userId, id, req.ip);
  }
}
