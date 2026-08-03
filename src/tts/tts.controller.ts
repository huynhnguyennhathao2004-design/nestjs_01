import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  TtsVoice,
} from './dto/create-tts-job.dto';
import { CreateTtsJobDto } from './dto/create-tts-job.dto';
import { TtsJobParamDto } from './dto/tts-job-param.dto';
import { RunpodTtsService } from './runpod-tts.service';
import { TtsService } from './tts.service';

import {
  ListTtsHistoryQueryDto,
} from './dto/list-tts-history-query.dto';

import {
  TtsHistoryParamDto,
} from './dto/tts-history-param.dto';


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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async createJob(
    @CurrentUser()
    currentUser:
      AuthenticatedUser | undefined,

    @Body()
    dto: CreateTtsJobDto,
  ) {
    /*
     * JwtAuthGuard phải gắn người dùng
     * đã xác thực vào request.user.
     *
     * Kiểm tra lại để không phát sinh
     * lỗi currentUser.id khi dữ liệu thiếu.
     */
    if (!currentUser) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đăng nhập.',
      );
    }

    console.log(
      '[TtsController] Đã nhận yêu cầu tạo job:',
      {
        userId:
          currentUser.id,

        destinationId:
          dto.destinationId ?? null,

        voice:
          dto.voice ??
          TtsVoice.MALE,
      },
    );

    const result =
      await this.runpodTtsService.createJob(
        currentUser.id,
        dto,
      );

    console.log(
      '[TtsController] Kết quả từ RunpodTtsService:',
      result,
    );

    if (
      !result ||
      typeof result !== 'object' ||
      !result.jobId
    ) {
      throw new InternalServerErrorException(
        'RunpodTtsService không trả về Job ID.',
      );
    }

    return result;
  }

  /**
   * Kiểm tra trạng thái job RunPod.
   *
   * GET /api/tts/jobs/:jobId
   */
  /**
   * Kiểm tra trạng thái job RunPod.
   *
   * GET /api/tts/jobs/:jobId
   */

    /**
   * Lấy lịch sử tạo giọng đọc của
   * tài khoản đang đăng nhập.
   *
   * GET /api/tts/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getUserTtsHistory(
    @CurrentUser()
    currentUser:
      AuthenticatedUser | undefined,

    @Query()
    query:
      ListTtsHistoryQueryDto,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đăng nhập.',
      );
    }

    return this.runpodTtsService
      .findUserHistory(
        currentUser.id,
        query,
      );
  }

    /**
   * Nghe hoặc tải file âm thanh lịch sử
   * trực tiếp từ Cloudflare R2.
   *
   * GET /api/tts/history/:ttsJobId/audio
   */
  @Get('history/:ttsJobId/audio')
  @UseGuards(JwtAuthGuard)
  async getHistoryAudio(
    @CurrentUser()
    currentUser:
      AuthenticatedUser | undefined,

    @Param()
    params:
      TtsHistoryParamDto,

    @Res()
    res: Response,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đăng nhập.',
      );
    }

    console.log(
      '[TtsController] Đọc audio lịch sử từ R2:',
      {
        userId:
          currentUser.id,

        ttsJobId:
          params.ttsJobId,
      },
    );

    const audio =
      await this.runpodTtsService
        .getHistoryAudio(
          currentUser.id,
          params.ttsJobId,
        );

    res.setHeader(
      'Content-Type',
      audio.mimeType,
    );

    /*
     * Dùng inline để trình duyệt có thể
     * phát trực tiếp. Frontend vẫn có thể
     * tải xuống bằng Blob.
     */
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${audio.filename}"`,
    );

    res.setHeader(
      'Content-Length',
      audio.buffer.length.toString(),
    );

    /*
     * Đây là dữ liệu riêng của tài khoản,
     * không cho proxy công cộng cache lại.
     */
    res.setHeader(
      'Cache-Control',
      'private, no-store',
    );

    res.setHeader(
      'X-Content-Type-Options',
      'nosniff',
    );

    return res.send(
      audio.buffer,
    );
  }

  @Get('jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  getRunpodJobStatus(
    @CurrentUser()
    currentUser:
      AuthenticatedUser | undefined,

    @Param()
    params: TtsJobParamDto,

    @Query('voice')
    voice: TtsVoice =
      TtsVoice.MALE,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đăng nhập.',
      );
    }

    const selectedVoice =
      voice === TtsVoice.FEMALE
        ? TtsVoice.FEMALE
        : TtsVoice.MALE;

    return this.runpodTtsService
      .getPublicJobStatus(
        currentUser.id,
        params.jobId,
        selectedVoice,
      );
  }

  /**
   * Lấy file WAV khi RunPod hoàn thành job.
   *
   * GET /api/tts/jobs/:jobId/audio
   */
  @Get('jobs/:jobId/audio')
  @UseGuards(JwtAuthGuard)
  async getJobAudio(
    @CurrentUser()
    currentUser:
      AuthenticatedUser | undefined,

    @Param()
    params: TtsJobParamDto,

    @Query('voice')
    voice: TtsVoice =
      TtsVoice.MALE,

    @Res()
    res: Response,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đăng nhập.',
      );
    }

    const selectedVoice =
      voice === TtsVoice.FEMALE
        ? TtsVoice.FEMALE
        : TtsVoice.MALE;

    console.log(
      '[TtsController] Tải audio:',
      {
        userId:
          currentUser.id,

        jobId:
          params.jobId,

        voice:
          selectedVoice,
      },
    );

    const audio =
      await this.runpodTtsService
        .getAudio(
          currentUser.id,
          params.jobId,
          selectedVoice,
        );

    res.setHeader(
      'Content-Type',
      audio.mimeType,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${audio.filename}"`,
    );

    res.setHeader(
      'Content-Length',
      audio.buffer.length.toString(),
    );

    return res.send(
      audio.buffer,
    );
  }
}