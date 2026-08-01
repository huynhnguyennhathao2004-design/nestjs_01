import { Module } from '@nestjs/common';
import { TextNormalizerService } from './text-normalizer.service';

@Module({
  providers: [TextNormalizerService],

  // Bắt buộc export để TtsModule dùng được
  exports: [TextNormalizerService],
})
export class TextNormalizerModule {}