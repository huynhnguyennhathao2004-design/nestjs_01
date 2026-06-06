import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TtsService } from './tts.service';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('generate')
  async generateAudio(
    @Body() body: { text: string; voice?: string },
    @Res() res: Response,
  ) {
    console.log('Đã nhận request TTS:', body);

    const allowedVoices = [
      'alloy',
      'ash',
      'ballad',
      'coral',
      'echo',
      'fable',
      'nova',
      'onyx',
      'sage',
      'shimmer',
    ];

    const voice = allowedVoices.includes(body.voice || '')
      ? body.voice
      : 'alloy';

    const audioBuffer = await this.ttsService.generateSpeech(
      body.text,
      voice as any,
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="du-lich-viet-nam.mp3"',
    );

    return res.send(audioBuffer);
  }
}
