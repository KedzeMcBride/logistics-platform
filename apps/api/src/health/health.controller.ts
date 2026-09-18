import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const result = {
      status: 'ok' as 'ok' | 'error',
      timestamp: new Date().toISOString(),
      db: 'unknown' as 'ok' | 'error' | 'unknown',
      redis: 'unknown' as 'ok' | 'error' | 'unknown',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      result.db = 'ok';
    } catch {
      result.db = 'error';
      result.status = 'error';
    }

    try {
      const pong = await this.redis.client.ping();
      result.redis = pong === 'PONG' ? 'ok' : 'error';
      if (result.redis === 'error') result.status = 'error';
    } catch {
      result.redis = 'error';
      result.status = 'error';
    }

    return result;
  }
}
