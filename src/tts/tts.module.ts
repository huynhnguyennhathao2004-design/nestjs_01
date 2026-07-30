import { Module } from '@nestjs/common';
import { TtsController } from './tts.controller';
import { TtsService } from './tts.service';

import { HttpModule } from '@nestjs/axios';
import { RunpodTtsService } from './runpod-tts.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15_000,
      maxRedirects: 0,
    }),
  ],
  controllers: [TtsController],
  providers: [TtsService,RunpodTtsService],
  exports: [
    TtsService,
    RunpodTtsService,
  ],
})
export class TtsModule {}
