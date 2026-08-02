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
import { CreateTtsJobDto, TtsVoice } from './dto/create-tts-job.dto';

import {
  PublicTtsJobStatus,
  RunpodStatusResponse,
  RunpodSubmitResponse,
  TtsAudioFile,
} from './interfaces/runpod.interface';

@Injectable()
export class RunpodTtsService implements OnModuleInit {
  private readonly apiKey: string;
 private readonly maleEndpointId: string;
 private readonly femaleEndpointId: string;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;
  private readonly maxTextCharacters: number;
  private readonly maxOutputBytes: number;
  private readonly audioDownloadTimeoutMs: number;


  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,

  ) {
    this.apiKey =
      this.configService.get<string>('RUNPOD_API_KEY')?.trim() ?? '';

    this.maleEndpointId =
    this.configService
    .get<string>('RUNPOD_MALE_ENDPOINT_ID')
    ?.trim() ?? '';

    this.femaleEndpointId =
    this.configService
    .get<string>('RUNPOD_FEMALE_ENDPOINT_ID')
    ?.trim() ?? '';

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
      5000,
    );

    this.maxOutputBytes = this.readPositiveInteger(
      'TTS_MAX_OUTPUT_BYTES',
      50_000_000,
    );
    this.audioDownloadTimeoutMs = this.readPositiveInteger(
      'TTS_AUDIO_DOWNLOAD_TIMEOUT_MS',
      180_000,
    );
  }

onModuleInit(): void {
  if (!this.apiKey) {
    throw new Error(
      'Thiếu biến môi trường RUNPOD_API_KEY.',
    );
  }

  const endpoints = [
    {
      name: 'RUNPOD_MALE_ENDPOINT_ID',
      value: this.maleEndpointId,
    },
    {
      name: 'RUNPOD_FEMALE_ENDPOINT_ID',
      value: this.femaleEndpointId,
    },
  ];

  for (const endpoint of endpoints) {
    if (!endpoint.value) {
      throw new Error(
        `Thiếu biến môi trường ${endpoint.name}.`,
      );
    }

    if (
      !/^[a-zA-Z0-9_-]+$/.test(
        endpoint.value,
      )
    ) {
      throw new Error(
        `${endpoint.name} không đúng định dạng.`,
      );
    }
  }
}
private getEndpointId(
  voice: TtsVoice = TtsVoice.MALE,
): string {
  if (voice === TtsVoice.FEMALE) {
    return this.femaleEndpointId;
  }

  return this.maleEndpointId;
}
async createJob(dto: CreateTtsJobDto) {
  /*
   * NestJS chỉ làm sạch Unicode và khoảng trắng.
   * Toàn bộ chuẩn hóa số, ngày, giờ, tiền và đơn vị
   * được thực hiện tại RunPod worker Python.
   */
  const voice =
  dto.voice ?? TtsVoice.MALE;

const endpointId =
  this.getEndpointId(voice);
  const requestText =
    this.normalizeWhitespace(dto.text);

  if (!requestText) {
    throw new ConflictException(
      'Nội dung không được để trống.',
    );
  }

  if (
    requestText.length >
    this.maxTextCharacters
  ) {
    throw new ConflictException(
      `Nội dung không được vượt quá ${this.maxTextCharacters} ký tự.`,
    );
  }

  console.log(
    '\n========== TEXT GỬI RUNPOD ==========',
  );

  console.log(
    '[NestJS] Văn bản nguyên bản gửi RunPod:',
  );

  console.log(requestText);

  console.log(
    '=====================================\n',
  );

  const requestBody = {
    input: {
      text: requestText,
      speed: dto.speed ?? 1.0,
      nfe_step: dto.nfeStep ?? 32,
    },
  };

  /*
   * Chuyển JSON thành UTF-8 bytes để giữ đúng
   * nội dung tiếng Việt khi gửi sang RunPod.
   */
  const utf8Body = Buffer.from(
    JSON.stringify(requestBody),
    'utf8',
  );

  try {
    const response = await firstValueFrom(
      this.httpService.post<RunpodSubmitResponse>(
        this.getRunUrl(endpointId),
        utf8Body,
        this.getRequestConfig(),
      ),
    );

    console.log(
      '[RunpodTtsService] Response từ RunPod:',
      response.data,
    );

    const jobId =
      response.data?.id?.trim();

    if (!jobId) {
      throw new BadGatewayException(
        'RunPod không trả về Job ID.',
      );
    }

    const result = {
      jobId,
      status: 'queued' as const,
      runpodStatus:
        response.data.status ?? 'IN_QUEUE',
      message:
        'Đang khởi động mô hình AI.',
      voice,

      statusUrl:
        `/api/tts/jobs/${jobId}` +
        `?voice=${encodeURIComponent(voice)}`,

      audioUrl:
        `/api/tts/jobs/${jobId}/audio` +
        `?voice=${encodeURIComponent(voice)}`,
    };

    console.log(
      '[RunpodTtsService] Phản hồi gửi frontend:',
      result,
    );

    return result;
  } catch (error: unknown) {
    this.rethrowRunpodError(
      error,
      'submit',
    );
  }
}
async getPublicJobStatus(
  jobId: string,
  voice: TtsVoice = TtsVoice.MALE,
) {
  const result =
    await this.getRawJobStatus(
      jobId,
      voice,
    );
    const publicStatus = this.mapPublicStatus(result);

    const workerAudioUrl =
    result.output?.audioUrl ??
    result.output?.audio?.url;

    const audioReady =
    publicStatus === 'completed' &&
    result.output?.success === true &&

  Boolean(
    workerAudioUrl ||
    result.output?.audio?.base64,
  );

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
        ? (
            `/api/tts/jobs/${jobId}/audio` +
            `?voice=${encodeURIComponent(voice)}`
          )
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

async getAudio(
  jobId: string,
  voice: TtsVoice = TtsVoice.MALE,
): Promise<TtsAudioFile> {
  const result =
    await this.getRawJobStatus(
      jobId,
      voice,
    );

    if (
      result.status === 'IN_QUEUE' ||
      result.status === 'IN_PROGRESS' ||
      result.status === 'RUNNING'
    ) {
      throw new ConflictException({
        message:
          'Giọng đọc chưa được tạo xong.',
        jobId,
        runpodStatus: result.status,
      });
    }

    if (result.status !== 'COMPLETED') {
      throw new BadGatewayException({
        message:
          'Job tạo giọng đọc không hoàn thành.',
        jobId,
        runpodStatus: result.status,
        workerError:
          this.getSafeWorkerError(result),
      });
    }

    if (result.output?.success !== true) {
      throw new BadGatewayException({
        message:
          'Worker báo tạo giọng đọc thất bại.',
        jobId,
        workerError:
          this.getSafeWorkerError(result),
      });
    }

    const output = result.output;

    const filename = this.sanitizeFilename(
      output.audio?.filename ??
        `f5tts-${jobId}.wav`,
    );

    const mimeType =
      output.audio?.mime_type ??
      'audio/wav';

    const declaredSize =
      output.audio?.size_bytes;

    /*
    * Ưu tiên job mới dùng object storage.
    */
    const audioUrl =
      output.audioUrl ??
      output.audio?.url;

    if (audioUrl) {
      const audioBuffer =
        await this.downloadAudioFromUrl(
          audioUrl,
        );

      if (
        typeof declaredSize === 'number' &&
        declaredSize > 0 &&
        declaredSize !== audioBuffer.length
      ) {
        throw new BadGatewayException(
          'Kích thước file tải từ object storage ' +
          'không khớp với metadata.',
        );
      }

      return {
        buffer: audioBuffer,
        filename,
        mimeType,
      };
    }

    /*
    * Fallback cho các job cũ vẫn trả Base64.
    */
    const rawBase64 =
      output.audio?.base64?.replace(
        /\s+/g,
        '',
      );

    if (!rawBase64) {
      throw new BadGatewayException(
        'Kết quả không chứa audioUrl ' +
        'hoặc dữ liệu âm thanh Base64.',
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

    if (
      audioBuffer.length >
      this.maxOutputBytes
    ) {
      throw new BadGatewayException(
        `File âm thanh vượt quá giới hạn ` +
        `${this.maxOutputBytes} byte.`,
      );
    }

    return {
      buffer: audioBuffer,
      filename,
      mimeType,
    };
  }

  private async downloadAudioFromUrl(
  audioUrl: string,
): Promise<Buffer> {
  /*
   * Kiểm tra worker có trả về URL hợp lệ hay không.
   */
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(audioUrl);
  } catch {
    throw new BadGatewayException(
      'Worker trả về audioUrl không hợp lệ.',
    );
  }

  /*
   * Signed URL từ Cloudflare R2 phải dùng HTTPS.
   * Không cho backend tải URL HTTP không bảo mật.
   */
  if (parsedUrl.protocol !== 'https:') {
    throw new BadGatewayException(
      'audioUrl phải sử dụng giao thức HTTPS.',
    );
  }

  try {
    const response =
      await axios.get<ArrayBuffer>(
        audioUrl,
        {
          responseType: 'arraybuffer',

          /*
           * Thời gian tối đa tải file WAV từ
           * object storage.
           */
          timeout:
            this.audioDownloadTimeoutMs,

          /*
           * Cho phép một số redirect nếu dịch vụ
           * object storage chuyển hướng URL.
           */
          maxRedirects: 5,

          /*
           * Ngăn backend tải file vượt quá giới hạn.
           */
          maxContentLength:
            this.maxOutputBytes,

          maxBodyLength:
            this.maxOutputBytes,

          headers: {
            Accept: [
              'audio/wav',
              'audio/*',
              'application/octet-stream',
            ].join(', '),
          },

          /*
           * Chỉ chấp nhận HTTP 2xx.
           */
          validateStatus: (
            status: number,
          ): boolean => {
            return (
              status >= 200 &&
              status < 300
            );
          },
        },
      );

    const audioBuffer = Buffer.from(
      response.data,
    );

    if (audioBuffer.length === 0) {
      throw new BadGatewayException(
        'File âm thanh trên object storage đang trống.',
      );
    }

    if (
      audioBuffer.length >
      this.maxOutputBytes
    ) {
      throw new BadGatewayException(
        'File âm thanh vượt quá giới hạn ' +
        `${this.maxOutputBytes} byte.`,
      );
    }

    return audioBuffer;
  } catch (error: unknown) {
    /*
     * Giữ nguyên exception do chính hàm này tạo.
     */
    if (
      error instanceof
      BadGatewayException
    ) {
      throw error;
    }

    /*
     * Xử lý trường hợp tải quá thời gian.
     */
    if (
      axios.isAxiosError(error) &&
      (
        error.code ===
          'ECONNABORTED' ||
        error.code ===
          'ETIMEDOUT'
      )
    ) {
      throw new GatewayTimeoutException(
        'Quá thời gian tải file âm thanh ' +
        'từ kho lưu trữ.',
      );
    }

    if (axios.isAxiosError(error)) {
      const storageHttpStatus =
        error.response?.status;

      /*
       * Signed URL hết hạn hoặc không có quyền.
       */
      if (
        storageHttpStatus === 401 ||
        storageHttpStatus === 403
      ) {
        throw new BadGatewayException({
          message:
            'Đường dẫn tải âm thanh đã hết hạn ' +
            'hoặc không có quyền truy cập.',
          storageHttpStatus,
        });
      }

      /*
       * File không còn tồn tại trên bucket.
       */
      if (storageHttpStatus === 404) {
        throw new NotFoundException(
          'File âm thanh không còn tồn tại ' +
          'trên kho lưu trữ.',
        );
      }

      throw new BadGatewayException({
        message:
          'Không thể tải file âm thanh ' +
          'từ kho lưu trữ.',
        storageHttpStatus:
          storageHttpStatus ?? null,
      });
    }

    throw new BadGatewayException(
      'Có lỗi khi đọc file âm thanh ' +
      'từ kho lưu trữ.',
    );
  }
}

    private async getRawJobStatus(
    jobId: string,
    voice: TtsVoice = TtsVoice.MALE,
  ): Promise<RunpodStatusResponse> {
    const endpointId =
      this.getEndpointId(voice);

    try {
      const response = await firstValueFrom(
        this.httpService.get<RunpodStatusResponse>(
          this.getStatusUrl(endpointId, jobId),
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

  private normalizeWhitespace(text: string): string {
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

  /*
   * Lỗi dạng chuỗi từ các worker cũ.
   */
  if (
    typeof workerError === 'string'
  ) {
    return workerError.slice(
      0,
      500,
    );
  }

  /*
   * Handler mới trả:
   *
   * {
   *   type: "RuntimeError",
   *   message: "..."
   * }
   */
  if (
    workerError &&
    typeof workerError === 'object'
  ) {
    if (
      'message' in workerError &&
      typeof workerError.message ===
        'string'
    ) {
      return workerError.message.slice(
        0,
        500,
      );
    }

    try {
      return JSON.stringify(
        workerError,
      ).slice(0, 500);
    } catch {
      return (
        'Worker gặp lỗi không xác định.'
      );
    }
  }

  return null;
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
private getRunUrl(
  endpointId: string,
): string {
  return (
    `${this.baseUrl}/` +
    `${encodeURIComponent(endpointId)}/run`
  );
}

private getStatusUrl(
  endpointId: string,
  jobId: string,
): string {
  return (
    `${this.baseUrl}/` +
    `${encodeURIComponent(endpointId)}/status/` +
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