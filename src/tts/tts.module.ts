import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TtsController } from './tts.controller';
import { TtsService } from './tts.service';
import { RunpodTtsService } from './runpod-tts.service';

import { TextNormalizerModule } from '../common/text-normalizer/text-normalizer.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15_000,
      maxRedirects: 0,
    }),

    // Bắt buộc phải có dòng này
    TextNormalizerModule,
        /*
     * Cung cấp JwtAuthGuard cho
     * các API F5-TTS cần đăng nhập.
     */
    AuthModule,
  ],

  controllers: [TtsController],

  providers: [
    TtsService,
    RunpodTtsService,
  ],

  exports: [
    TtsService,
    RunpodTtsService,
  ],
})
export class TtsModule {}