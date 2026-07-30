import {
  BadGatewayException,
  ConflictException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

import { CreateTtsJobDto } from './dto/create-tts-job.dto';
import {
  PublicTtsJobStatus,
  RunpodStatusResponse,
  RunpodSubmitResponse,
  TtsAudioFile,
} from './interfaces/runpod.interface';

@Injectable()
export class RunpodTtsService implements OnModuleInit {
  private readonly apiKey: string;
  private readonly endpointId: string;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;
  private readonly maxTextCharacters: number;
  private readonly maxOutputBytes: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey =
      this.configService.get<string>('RUNPOD_API_KEY')?.trim() ?? '';

    this.endpointId =
      this.configService.get<string>('RUNPOD_ENDPOINT_ID')?.trim() ?? '';

    this.baseUrl = (
      this.configService.get<string>('RUNPOD_API_BASE_URL') ??
      'https://api.runpod.ai/v2'
    ).replace(/\/+$/, '');

    this.httpTimeoutMs = this.readPositiveInteger(
      'RUNPOD_HTTP_TIMEOUT_MS',
      15_000,
    );

    this.maxTextCharacters = this.readPositiveInteger(
      'TTS_MAX_TEXT_CHARACTERS',
      800,
    );

    this.maxOutputBytes = this.readPositiveInteger(
      'TTS_MAX_OUTPUT_BYTES',
      7_000_000,
    );
  }

  onModuleInit(): void {
    if (!this.apiKey) {
      throw new Error(
        'Thiếu biến môi trường RUNPOD_API_KEY.',
      );
    }

    if (!this.endpointId) {
      throw new Error(
        'Thiếu biến môi trường RUNPOD_ENDPOINT_ID.',
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(this.endpointId)) {
      throw new Error(
        'RUNPOD_ENDPOINT_ID không đúng định dạng.',
      );
    }
  }

  async createJob(dto: CreateTtsJobDto) {
    const normalizedText = this.normalizeText(dto.text);

    if (!normalizedText) {
      throw new ConflictException(
        'Nội dung không được để trống.',
      );
    }

    if (normalizedText.length > this.maxTextCharacters) {
      throw new ConflictException(
        `Nội dung không được vượt quá ${this.maxTextCharacters} ký tự.`,
      );
    }

    const requestBody = {
      input: {
        text: normalizedText,
        speed: dto.speed ?? 1.0,
        nfe_step: dto.nfeStep ?? 32,
      },
    };

    /*
     * Chuyển JSON thành UTF-8 bytes để tránh lỗi mojibake
     * từng xuất hiện khi gửi tiếng Việt từ PowerShell.
     */
    const utf8Body = Buffer.from(
      JSON.stringify(requestBody),
      'utf8',
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<RunpodSubmitResponse>(
          this.getRunUrl(),
          utf8Body,
          this.getRequestConfig(),
        ),
      );

      const jobId = response.data?.id?.trim();

      if (!jobId) {
        throw new BadGatewayException(
          'RunPod không trả về Job ID.',
        );
      }

      return {
        jobId,
        status: 'queued' as const,
        runpodStatus: response.data.status ?? 'IN_QUEUE',
        message: 'Đang khởi động mô hình AI.',
        statusUrl: `/api/tts/jobs/${jobId}`,
        audioUrl: `/api/tts/jobs/${jobId}/audio`,
      };
    } catch (error: unknown) {
      this.rethrowRunpodError(error, 'submit');
    }
  }

  async getPublicJobStatus(jobId: string) {
    const result = await this.getRawJobStatus(jobId);
    const publicStatus = this.mapPublicStatus(result);

    const audioReady =
      publicStatus === 'completed' &&
      result.output?.success === true &&
      Boolean(result.output.audio?.base64);

    return {
      jobId: result.id ?? jobId,
      status: publicStatus,
      runpodStatus: result.status,
      message: this.getStatusMessage(
        publicStatus,
        result.status,
      ),
      audioReady,
      audioUrl: audioReady
        ? `/api/tts/jobs/${jobId}/audio`
        : null,
      metrics: {
        delayTimeMs: result.delayTime ?? null,
        executionTimeMs: result.executionTime ?? null,
        sampleRate:
          result.output?.audio?.sample_rate ?? null,
        sizeBytes:
          result.output?.audio?.size_bytes ?? null,
        modelReadySeconds:
          result.output?.timing
            ?.worker_model_ready_seconds ?? null,
        inferenceSeconds:
          result.output?.timing?.inference_seconds ??
          null,
        requestTotalSeconds:
          result.output?.timing
            ?.request_total_seconds ?? null,
        gpu: result.output?.worker?.gpu ?? null,
      },
      error:
        publicStatus === 'failed'
          ? this.getSafeWorkerError(result)
          : null,
    };
  }

  async getAudio(jobId: string): Promise<TtsAudioFile> {
    const result = await this.getRawJobStatus(jobId);

    if (
      result.status === 'IN_QUEUE' ||
      result.status === 'IN_PROGRESS' ||
      result.status === 'RUNNING'
    ) {
      throw new ConflictException({
        message: 'Giọng đọc chưa được tạo xong.',
        jobId,
        runpodStatus: result.status,
      });
    }

    if (result.status !== 'COMPLETED') {
      throw new BadGatewayException({
        message: 'Job tạo giọng đọc không hoàn thành.',
        jobId,
        runpodStatus: result.status,
        workerError: this.getSafeWorkerError(result),
      });
    }

    if (result.output?.success !== true) {
      throw new BadGatewayException({
        message: 'Worker báo tạo giọng đọc thất bại.',
        jobId,
        workerError: this.getSafeWorkerError(result),
      });
    }

    const rawBase64 =
      result.output.audio?.base64?.replace(/\s+/g, '');

    if (!rawBase64) {
      throw new BadGatewayException(
        'Kết quả không chứa dữ liệu âm thanh Base64.',
      );
    }

    if (!this.isValidBase64(rawBase64)) {
      throw new BadGatewayException(
        'Dữ liệu âm thanh Base64 không hợp lệ.',
      );
    }

    const audioBuffer = Buffer.from(
      rawBase64,
      'base64',
    );

    if (audioBuffer.length === 0) {
      throw new BadGatewayException(
        'File âm thanh nhận được đang trống.',
      );
    }

    if (audioBuffer.length > this.maxOutputBytes) {
      throw new BadGatewayException(
        `File âm thanh vượt quá giới hạn ${this.maxOutputBytes} byte.`,
      );
    }

    const declaredSize =
      result.output.audio?.size_bytes;

    if (
      typeof declaredSize === 'number' &&
      declaredSize > 0 &&
      declaredSize !== audioBuffer.length
    ) {
      throw new BadGatewayException(
        'Kích thước file âm thanh không khớp với metadata.',
      );
    }

    return {
      buffer: audioBuffer,
      filename: this.sanitizeFilename(
        result.output.audio?.filename ??
          `f5tts-${jobId}.wav`,
      ),
      mimeType:
        result.output.audio?.mime_type ??
        'audio/wav',
    };
  }

  private async getRawJobStatus(
    jobId: string,
  ): Promise<RunpodStatusResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<RunpodStatusResponse>(
          this.getStatusUrl(jobId),
          this.getRequestConfig(),
        ),
      );

      if (!response.data?.status) {
        throw new BadGatewayException(
          'RunPod không trả về trạng thái job.',
        );
      }

      return response.data;
    } catch (error: unknown) {
      this.rethrowRunpodError(error, 'status');
    }
  }

  private mapPublicStatus(
    result: RunpodStatusResponse,
  ): PublicTtsJobStatus {
    if (result.status === 'IN_QUEUE') {
      return 'queued';
    }

    if (
      result.status === 'IN_PROGRESS' ||
      result.status === 'RUNNING'
    ) {
      return 'processing';
    }

    if (result.status === 'COMPLETED') {
      return result.output?.success === false
        ? 'failed'
        : 'completed';
    }

    if (
      result.status === 'FAILED' ||
      result.status === 'CANCELLED' ||
      result.status === 'TIMED_OUT'
    ) {
      return 'failed';
    }

    return 'unknown';
  }

  private getStatusMessage(
    publicStatus: PublicTtsJobStatus,
    runpodStatus: string,
  ): string {
    switch (publicStatus) {
      case 'queued':
        return 'Đang khởi động mô hình AI.';

      case 'processing':
        return 'Đang tạo giọng đọc.';

      case 'completed':
        return 'Tạo giọng đọc hoàn thành.';

      case 'failed':
        if (runpodStatus === 'TIMED_OUT') {
          return 'Quá trình tạo giọng đọc đã hết thời gian.';
        }

        if (runpodStatus === 'CANCELLED') {
          return 'Quá trình tạo giọng đọc đã bị hủy.';
        }

        return 'Không thể tạo giọng đọc.';

      default:
        return 'Đang kiểm tra trạng thái giọng đọc.';
    }
  }

  private normalizeText(text: string): string {
    return text
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getSafeWorkerError(
    result: RunpodStatusResponse,
  ): string | null {
    const workerError =
      result.output?.error ??
      result.output?.message ??
      result.error;

    if (typeof workerError !== 'string') {
      return null;
    }

    /*
     * Không trả toàn bộ traceback hoặc dữ liệu dài
     * của worker cho frontend.
     */
    return workerError.slice(0, 500);
  }

  private getRequestConfig(): AxiosRequestConfig {
    return {
      timeout: this.httpTimeoutMs,
      maxRedirects: 0,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
        'Content-Type':
          'application/json; charset=utf-8',
      },
    };
  }

  private getRunUrl(): string {
    return (
      `${this.baseUrl}/` +
      `${encodeURIComponent(this.endpointId)}/run`
    );
  }

  private getStatusUrl(jobId: string): string {
    return (
      `${this.baseUrl}/` +
      `${encodeURIComponent(this.endpointId)}/status/` +
      `${encodeURIComponent(jobId)}`
    );
  }

  private readPositiveInteger(
    variableName: string,
    fallbackValue: number,
  ): number {
    const rawValue =
      this.configService.get<string>(variableName);

    const parsedValue = Number(rawValue);

    if (
      !Number.isInteger(parsedValue) ||
      parsedValue <= 0
    ) {
      return fallbackValue;
    }

    return parsedValue;
  }

  private isValidBase64(value: string): boolean {
    if (value.length % 4 !== 0) {
      return false;
    }

    return /^[a-zA-Z0-9+/]*={0,2}$/.test(value);
  }

  private sanitizeFilename(filename: string): string {
    const safeName = filename.replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );

    return safeName.toLowerCase().endsWith('.wav')
      ? safeName
      : `${safeName}.wav`;
  }

  private rethrowRunpodError(
    error: unknown,
    action: 'submit' | 'status',
  ): never {
    /*
     * Giữ nguyên các exception do chính service tạo.
     */
    if (
      error instanceof BadGatewayException ||
      error instanceof ConflictException ||
      error instanceof NotFoundException ||
      error instanceof GatewayTimeoutException
    ) {
      throw error;
    }

    if (!axios.isAxiosError(error)) {
      throw new InternalServerErrorException(
        'Có lỗi nội bộ khi xử lý yêu cầu TTS.',
      );
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT'
    ) {
      throw new GatewayTimeoutException(
        'Không nhận được phản hồi kịp thời từ RunPod.',
      );
    }

    const responseStatus = error.response?.status;

    if (
      action === 'status' &&
      responseStatus === 404
    ) {
      throw new NotFoundException(
        'Không tìm thấy job TTS hoặc kết quả đã hết hạn.',
      );
    }

    if (
      responseStatus === 401 ||
      responseStatus === 403
    ) {
      /*
       * Không nói cho frontend biết API key cụ thể.
       */
      throw new BadGatewayException(
        'Backend chưa xác thực được với dịch vụ AI.',
      );
    }

    if (responseStatus === 429) {
      throw new BadGatewayException(
        'Dịch vụ AI đang nhận quá nhiều yêu cầu.',
      );
    }

    throw new BadGatewayException({
      message:
        action === 'submit'
          ? 'Không thể gửi yêu cầu đến dịch vụ AI.'
          : 'Không thể kiểm tra trạng thái dịch vụ AI.',
      runpodHttpStatus: responseStatus ?? null,
    });
  }
}