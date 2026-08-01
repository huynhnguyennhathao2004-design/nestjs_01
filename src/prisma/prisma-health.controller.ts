import { Controller, Get } from '@nestjs/common';

import { PrismaService } from './prisma.service';

@Controller('health/database')
export class PrismaHealthController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async checkDatabase() {
    const result =
      await this.prisma.$queryRaw<
        Array<{ ok: number }>
      >`
        SELECT 1::int AS ok
      `;

    return {
      status:
        result[0]?.ok === 1
          ? 'ok'
          : 'error',
      database: 'connected',
      checkedAt: new Date().toISOString(),
    };
  }
}