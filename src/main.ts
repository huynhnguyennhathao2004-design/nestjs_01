import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(
    `Backend đang chạy tại http://localhost:${port}/api`,
  );
}

bootstrap();
