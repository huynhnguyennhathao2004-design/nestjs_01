import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const connectionString =
      configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL chưa được cấu hình trong file .env',
      );
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    // Thực hiện một truy vấn thật để chắc chắn pooled URL hoạt động.
    await this.$queryRaw`SELECT 1`;

    this.logger.log(
      'Đã kết nối PostgreSQL Neon bằng DATABASE_URL pooled',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();

    this.logger.log(
      'Đã đóng kết nối PostgreSQL',
    );
  }
}