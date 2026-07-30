import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { CreateTtsJobDto } from './dto/create-tts-job.dto';
import { TtsJobParamDto } from './dto/tts-job-param.dto';
import { RunpodTtsService } from './runpod-tts.service';
import { TtsService } from './tts.service';

@Controller('tts')
export class TtsController {
  constructor(
    // Service TTS cũ, vẫn giữ để route /generate tiếp tục hoạt động
    private readonly ttsService: TtsService,

    // Service mới gọi RunPod Serverless
    private readonly runpodTtsService: RunpodTtsService,
  ) {}

  /**
   * Route TTS cũ.
   *
   * POST /api/tts/generate
   *
   * Route này hiện vẫn trả MP3 trực tiếp.
   */
  @Post('generate')
  async generateAudio(
    @Body() body: { text: string; voice?: string },
    @Res() response: Response,
  ): Promise<void> {
    console.log('Đã nhận request TTS cũ');

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

    const voice = allowedVoices.includes(body.voice ?? '')
      ? body.voice
      : 'alloy';

    const audioBuffer = await this.ttsService.generateSpeech(
      body.text,
      voice as any,
    );

    response.setHeader('Content-Type', 'audio/mpeg');

    response.setHeader(
      'Content-Disposition',
      'attachment; filename="du-lich-viet-nam.mp3"',
    );

    response.status(HttpStatus.OK).send(audioBuffer);
  }

  /**
   * Tạo một job F5-TTS mới trên RunPod.
   *
   * POST /api/tts/jobs
   */
  @Post('jobs')
  @HttpCode(HttpStatus.ACCEPTED)
  createRunpodJob(
    @Body() createTtsJobDto: CreateTtsJobDto,
  ) {
    return this.runpodTtsService.createJob(
      createTtsJobDto,
    );
  }

  /**
   * Kiểm tra trạng thái job RunPod.
   *
   * GET /api/tts/jobs/:jobId
   */
  @Get('jobs/:jobId')
  getRunpodJobStatus(
    @Param() params: TtsJobParamDto,
  ) {
    return this.runpodTtsService.getPublicJobStatus(
      params.jobId,
    );
  }

  /**
   * Lấy file WAV khi RunPod đã hoàn thành job.
   *
   * GET /api/tts/jobs/:jobId/audio
   */
  @Get('jobs/:jobId/audio')
  async getRunpodJobAudio(
    @Param() params: TtsJobParamDto,
    @Res() response: Response,
  ): Promise<void> {
    const audio =
      await this.runpodTtsService.getAudio(
        params.jobId,
      );

    response.setHeader(
      'Content-Type',
      audio.mimeType,
    );

    response.setHeader(
      'Content-Length',
      audio.buffer.length.toString(),
    );

    response.setHeader(
      'Content-Disposition',
      `inline; filename="${audio.filename}"`,
    );

    response.setHeader(
      'Cache-Control',
      'private, max-age=300',
    );

    response.status(HttpStatus.OK).send(
      audio.buffer,
    );
  }
}