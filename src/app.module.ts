import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TtsModule } from './tts/tts.module';

import { PrismaModule } from './prisma/prisma.module';
import { DestinationsModule } from './destinations/destinations.module';


import {
  AdminModule,
} from './admin/admin.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
	
    AdminModule,

    DestinationsModule,

    PrismaModule,

    AuthModule,

    TtsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
