import {
  Global,
  Module,
} from '@nestjs/common';

import { PrismaHealthController } from './prisma-health.controller';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  controllers: [
    PrismaHealthController,
  ],
  providers: [
    PrismaService,
  ],
  exports: [
    PrismaService,
  ],
})
export class PrismaModule {}