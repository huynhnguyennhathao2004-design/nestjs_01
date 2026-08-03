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

import { StorageProvider,TtsJobStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

import { CreateTtsJobDto, TtsVoice } from './dto/create-tts-job.dto';
import { createHash } from 'node:crypto';
import {
  PublicTtsJobStatus,
  RunpodStatusResponse,
  RunpodSubmitResponse,
  TtsAudioFile,
} from './interfaces/runpod.interface';

import type {
  Prisma,
} from '../generated/prisma/client';

import {
  ListTtsHistoryQueryDto,
} from './dto/list-tts-history-query.dto';

import {
  R2StorageService,
} from './r2-storage.service';


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
  private readonly storageBucketName: string;


  constructor(
      private readonly httpService:
        HttpService,

      private readonly configService:
        ConfigService,

      private readonly prisma:
        PrismaService,

      private readonly r2StorageService:
        R2StorageService,

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
    this.storageBucketName =
    this.configService
      .get<string>(
        'OBJECT_STORAGE_BUCKET',
      )
      ?.trim() ?? '';
  }

onModuleInit(): void {
  if (!this.apiKey) {
    throw new Error(
      'Thiếu biến môi trường RUNPOD_API_KEY.',
    );
  }
  if (!this.storageBucketName) {
    throw new Error(
      'Thiếu biến môi trường OBJECT_STORAGE_BUCKET.',
    );
  }

  if (
    this.storageBucketName.length > 255
  ) {
    throw new Error(
      'OBJECT_STORAGE_BUCKET vượt quá 255 ký tự.',
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
async createJob(
  userId: string,
  dto: CreateTtsJobDto,
) {
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
    this.normalizeWhitespace(
      dto.text,
    );

  const speed =
    dto.speed ?? 1.0;

  const nfeStep =
    dto.nfeStep ?? 32;

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
      `Nội dung không được vượt quá ` +
      `${this.maxTextCharacters} ký tự.`,
    );
  }

  /*
   * Khi frontend gửi destinationId,
   * backend phải tự kiểm tra địa điểm
   * có tồn tại và chưa bị xóa mềm.
   */
  if (dto.destinationId) {
    const destination =
      await this.prisma.destination.findFirst({
        where: {
          id: dto.destinationId,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    if (!destination) {
      throw new NotFoundException(
        'Không tìm thấy địa điểm được chọn.',
      );
    }
  }

  /*
   * Hash gồm toàn bộ dữ liệu có thể
   * ảnh hưởng tới kết quả âm thanh.
   */
  const inputHash =
    this.createInputHash({
      text: requestText,
      voice,
      speed,
      nfeStep,
    });

  /*
   * Tạo lịch sử trong database trước
   * khi gửi yêu cầu sang RunPod.
   */
  const databaseJob =
    await this.prisma.ttsJob.create({
      data: {
        userId,

        destinationId:
          dto.destinationId ?? null,

        sourceText:
          requestText,

        inputHash,

        voiceCode:
          voice,

        status:
          TtsJobStatus.QUEUED,
      },

      select: {
        id: true,
      },
    });

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
      text:
        requestText,

      speed,

      nfe_step:
        nfeStep,
    },
  };

  /*
   * Chuyển JSON thành UTF-8 bytes để giữ đúng
   * nội dung tiếng Việt khi gửi sang RunPod.
   */
  const utf8Body =
    Buffer.from(
      JSON.stringify(
        requestBody,
      ),
      'utf8',
    );

  try {
    const response =
      await firstValueFrom(
        this.httpService.post<RunpodSubmitResponse>(
          this.getRunUrl(
            endpointId,
          ),

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

    /*
     * Liên kết bản ghi nội bộ với
     * Job ID thật do RunPod trả về.
     */
    await this.prisma.ttsJob.update({
      where: {
        id: databaseJob.id,
      },

      data: {
        runpodJobId:
          jobId,
      },
    });

    const result = {
      /*
       * ID trong PostgreSQL, dùng cho
       * lịch sử TTS ở các bước sau.
       */
      ttsJobId:
        databaseJob.id,

      /*
       * ID của RunPod, tiếp tục dùng cho
       * polling hiện tại để không phá frontend.
       */
      jobId,

      status:
        'queued' as const,

      runpodStatus:
        response.data.status ??
        'IN_QUEUE',

      message:
        'Đang khởi động mô hình AI.',

      voice,

      statusUrl:
        `/api/tts/jobs/${jobId}` +
        `?voice=${encodeURIComponent(
          voice,
        )}`,

      audioUrl:
        `/api/tts/jobs/${jobId}/audio` +
        `?voice=${encodeURIComponent(
          voice,
        )}`,
    };

    console.log(
      '[RunpodTtsService] Phản hồi gửi frontend:',
      result,
    );

    return result;
  } catch (error: unknown) {
    /*
     * Nếu gửi RunPod thất bại,
     * giữ lại bản ghi để người dùng
     * và ADMIN có thể biết lần tạo đã lỗi.
     */
    try {
      await this.prisma.ttsJob.update({
        where: {
          id:
            databaseJob.id,
        },

        data: {
          status:
            TtsJobStatus.FAILED,

          errorCode:
            'RUNPOD_SUBMIT_FAILED',

          errorMessage:
            'Không thể gửi yêu cầu đến dịch vụ AI.',

          completedAt:
            new Date(),
        },
      });
    } catch (databaseError: unknown) {
      console.error(
        '[RunpodTtsService] Không thể cập nhật job thất bại:',
        databaseError,
      );
    }

    this.rethrowRunpodError(
      error,
      'submit',
    );
  }
}

async findUserHistory(
  userId: string,
  query: ListTtsHistoryQueryDto,
) {
  const page =
    query.page ?? 1;

  const limit =
    query.limit ?? 10;

  const skip =
    (page - 1) * limit;

  /*
   * userId luôn lấy từ access token.
   * Frontend không được tự chọn
   * lịch sử của tài khoản khác.
   */
  const where:
  Prisma.TtsJobWhereInput = {
    userId,

    deletedAt:
      null,

      ...(query.status
        ? {
            status:
              query.status,
          }
        : {}),

      ...(query.voice
        ? {
            voiceCode:
              query.voice,
          }
        : {}),

      ...(query.q
        ? {
            sourceText: {
              contains:
                query.q,

              mode:
                'insensitive',
            },
          }
        : {}),
    };

  /*
   * Đếm tổng và lấy danh sách trong
   * cùng một transaction đọc.
   */
  const [
    total,
    jobs,
  ] =
    await this.prisma.$transaction([
      this.prisma.ttsJob.count({
        where,
      }),

      this.prisma.ttsJob.findMany({
        where,

        skip,
        take:
          limit,

        orderBy: [
          {
            createdAt:
              'desc',
          },
          {
            id:
              'desc',
          },
        ],

        select: {
          id:
            true,

          runpodJobId:
            true,

          sourceText:
            true,

          voiceCode:
            true,

          modelName:
            true,

          status:
            true,

          errorCode:
            true,

          errorMessage:
            true,

          queuedAt:
            true,

          startedAt:
            true,

          completedAt:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          destination: {
            select: {
              id:
                true,

              slug:
                true,

              name:
                true,

              images: {
                where: {
                  isActive:
                    true,
                },

                orderBy: {
                  sortOrder:
                    'asc',
                },

                take:
                  1,

                select: {
                  url:
                    true,

                  altText:
                    true,
                },
              },
            },
          },

          audioFile: {
            select: {
              id:
                true,

              mimeType:
                true,

              fileExtension:
                true,

              sizeBytes:
                true,

              durationSeconds:
                true,

              deletedAt:
                true,

              createdAt:
                true,
            },
          },
        },
      }),
    ]);

  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total / limit,
        );

  const items =
    jobs.map((job) => {
      /*
       * Audio bị xóa mềm không còn được
       * xem là file có thể sử dụng.
       */
      const activeAudio =
        job.audioFile &&
        !job.audioFile.deletedAt
          ? job.audioFile
          : null;

      const destination =
        job.destination
          ? {
              /*
               * Giữ id dạng slug để tương thích
               * với frontend địa điểm hiện tại.
               */
              id:
                job.destination.slug,

              databaseId:
                job.destination.id,

              slug:
                job.destination.slug,

              name:
                job.destination.name,

              coverImage:
                job.destination
                  .images[0]
                  ? {
                      url:
                        job.destination
                          .images[0]
                          .url,

                      altText:
                        job.destination
                          .images[0]
                          .altText,
                    }
                  : null,
            }
          : null;

      const audio =
        activeAudio
          ? {
              id:
                activeAudio.id,

              mimeType:
                activeAudio.mimeType,

              fileExtension:
                activeAudio.fileExtension,

              sizeBytes:
                activeAudio.sizeBytes,

              durationSeconds:
                activeAudio
                  .durationSeconds !==
                null
                  ? Number(
                      activeAudio
                        .durationSeconds,
                    )
                  : null,

              createdAt:
                activeAudio.createdAt,
            }
          : null;

      return {
        id:
          job.id,

        runpodJobId:
          job.runpodJobId,

        sourceText:
          job.sourceText,

        voice:
          job.voiceCode,

        modelName:
          job.modelName,

        status:
          job.status,

        error:
          job.status ===
            TtsJobStatus.FAILED ||
          job.status ===
            TtsJobStatus.CANCELLED
            ? {
                code:
                  job.errorCode,

                message:
                  job.errorMessage,
              }
            : null,

        destination,

        audio,

        audioAvailable:
          Boolean(audio),

        queuedAt:
          job.queuedAt,

        startedAt:
          job.startedAt,

        completedAt:
          job.completedAt,

        createdAt:
          job.createdAt,

        updatedAt:
          job.updatedAt,
      };
    });

  return {
    items,

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasPreviousPage:
        page > 1,

      hasNextPage:
        page < totalPages,
    },
  };
}

private isRetryableDatabaseError(
  error: unknown,
): boolean {
  const message =
    error instanceof Error
      ? error.message
      : String(
          error ?? '',
        );

  const normalizedMessage =
    message.toLowerCase();

  return [
    'connection terminated unexpectedly',
    'econnreset',
    'connection closed',
    'server closed the connection unexpectedly',
  ].some((keyword) =>
    normalizedMessage.includes(
      keyword,
    ),
  );
}

private async wait(
  milliseconds: number,
): Promise<void> {
  await new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

private async findOwnedHistoryAudioJob(
  userId: string,
  ttsJobId: string,
) {
  const executeQuery = () =>
    this.prisma.ttsJob.findFirst({
      where: {
      id:
        ttsJobId,

      userId,

      deletedAt:
        null,
    },

      select: {
        id:
          true,

        status:
          true,

        audioFile: {
          select: {
            id:
              true,

            bucketName:
              true,

            objectKey:
              true,

            mimeType:
              true,

            fileExtension:
              true,

            sizeBytes:
              true,

            deletedAt:
              true,
          },
        },
      },
    });

  try {
    return await executeQuery();
  } catch (error: unknown) {
    if (
      !this.isRetryableDatabaseError(
        error,
      )
    ) {
      throw error;
    }

    /*
     * Neon hoặc kết nối pg-pool có thể
     * ngắt một socket không hoạt động.
     * Chờ ngắn rồi thử lại đúng một lần.
     */
    console.warn(
      '[RunpodTtsService] Kết nối PostgreSQL bị ngắt, thử lại truy vấn lịch sử một lần.',
      {
        ttsJobId,
      },
    );

    await this.wait(
      300,
    );

    return executeQuery();
  }
}
async softDeleteHistory(
  userId: string,
  ttsJobId: string,
) {
  const deletedAt =
    new Date();

  /*
   * Xóa mềm TtsJob và AudioFile
   * trong cùng một transaction.
   *
   * Không xóa object thật khỏi R2.
   */
  const result =
    await this.prisma.$transaction(
      async (transaction) => {
        const databaseJob =
          await transaction
            .ttsJob
            .findFirst({
              where: {
                id:
                  ttsJobId,

                userId,

                deletedAt:
                  null,
              },

              select: {
                id:
                  true,

                audioFile: {
                  select: {
                    id:
                      true,

                    deletedAt:
                      true,
                  },
                },
              },
            });

        if (!databaseJob) {
          throw new NotFoundException(
            'Không tìm thấy lịch sử TTS của tài khoản này.',
          );
        }

        await transaction
          .ttsJob
          .update({
            where: {
              id:
                databaseJob.id,
            },

            data: {
              deletedAt,
            },
          });

        /*
         * AudioFile có thể không tồn tại
         * đối với job cũ hoặc job thất bại.
         */
        if (
          databaseJob.audioFile &&
          !databaseJob
            .audioFile
            .deletedAt
        ) {
          await transaction
            .audioFile
            .update({
              where: {
                id:
                  databaseJob
                    .audioFile
                    .id,
              },

              data: {
                deletedAt,
              },
            });
        }

        return {
          id:
            databaseJob.id,

          deletedAt,
        };
      },
    );

  return {
    message:
      'Đã xóa lịch sử tạo giọng đọc.',

    id:
      result.id,

    deletedAt:
      result.deletedAt,
  };
}
async getHistoryAudio(
  userId: string,
  ttsJobId: string,

  options?: {
    recordDownload?: boolean;
    userAgent?: string | null;
  },
): Promise<TtsAudioFile> {
  /*
   * Truy vấn bằng UUID nội bộ của TtsJob.
   *
   * userId bắt buộc phải khớp tài khoản
   * đang đăng nhập để ngăn đọc file
   * của người dùng khác.
   */
  const databaseJob =
  await this.findOwnedHistoryAudioJob(
    userId,
    ttsJobId,
  );

  if (!databaseJob) {
    throw new NotFoundException(
      'Không tìm thấy lịch sử TTS của tài khoản này.',
    );
  }

  if (
    databaseJob.status !==
    TtsJobStatus.COMPLETED
  ) {
    throw new ConflictException(
      'Giọng đọc này chưa hoàn thành.',
    );
  }

  const audioFile =
    databaseJob.audioFile;

  if (
    !audioFile ||
    audioFile.deletedAt
  ) {
    throw new NotFoundException(
      'Lịch sử này chưa có file âm thanh khả dụng.',
    );
  }

  const bucketName =
    audioFile.bucketName
      .trim();

  const objectKey =
    audioFile.objectKey
      .trim();

  if (
    !bucketName ||
    !objectKey
  ) {
    throw new NotFoundException(
      'Metadata lưu trữ của file âm thanh chưa đầy đủ.',
    );
  }

  /*
   * Đọc trực tiếp object từ Cloudflare R2.
   * Không gọi RunPod và không sử dụng
   * signed URL cũ trong publicUrl.
   */
  const object =
    await this.r2StorageService
      .downloadAudioObject({
        bucketName,

        objectKey,

        fallbackMimeType:
          audioFile.mimeType,

        expectedSizeBytes:
          audioFile.sizeBytes,
      });

  const rawExtension =
    String(
      audioFile.fileExtension ??
      'wav',
    )
      .trim()
      .toLowerCase();

  /*
   * Chỉ giữ ký tự an toàn cho tên file.
   */
  const fileExtension =
    /^[a-z0-9]{1,20}$/.test(
      rawExtension,
    )
      ? rawExtension
      : 'wav';

/*
 * Chỉ ghi nhận khi frontend gọi route
 * tải xuống riêng. Việc nghe trực tuyến
 * không được tính là lượt tải.
 */
if (options?.recordDownload) {
  const normalizedUserAgent =
    typeof options.userAgent ===
      'string'
      ? options.userAgent
          .trim()
          .slice(0, 2000)
      : '';

  try {
    await this.prisma.audioDownload.create({
      data: {
        audioFileId:
          audioFile.id,

        userId,

        /*
         * Hiện chưa triển khai hash IP.
         * Trường này trong schema cho phép null.
         */
        ipHash:
          null,

        userAgent:
          normalizedUserAgent ||
          null,
      },
    });
  } catch (error: unknown) {
    /*
     * Lỗi thống kê không được làm người dùng
     * mất khả năng tải file đã đọc thành công.
     */
    console.warn(
      '[RunpodTtsService] Không thể ghi nhận lượt tải audio:',
      {
        ttsJobId:
          databaseJob.id,

        audioFileId:
          audioFile.id,

        error:
          error instanceof Error
            ? error.message
            : 'UnknownError',
      },
    );
  }
}

return {
  buffer:
    object.buffer,

  filename:
    `tts-history-${databaseJob.id}.` +
    fileExtension,

  mimeType:
    object.mimeType ||
    audioFile.mimeType ||
    'audio/wav',
};
}

private async getOwnedDatabaseJob(
  userId: string,
  runpodJobId: string,
) {
  const databaseJob =
    await this.prisma.ttsJob.findFirst({
      where: {
        userId,
        runpodJobId,

        deletedAt:
          null,
      },

      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

  if (!databaseJob) {
    throw new NotFoundException(
      'Không tìm thấy job TTS của tài khoản này.',
    );
  }

  return databaseJob;
}
private async upsertAudioFile(
  ttsJobId: string,
  result: RunpodStatusResponse,
): Promise<void> {
  const output =
    result.output;

  const audio =
    output?.audio;

  /*
   * Worker hiện trả URL ký có thời hạn
   * ở cả output.audioUrl và audio.url.
   */
  const audioUrl =
    (
      output?.audioUrl ??
      audio?.url ??
      ''
    ).trim();

  /*
   * storage_key là dữ liệu ổn định
   * dùng để tìm object trên Cloudflare R2
   * sau khi signed URL hết hạn.
   */
  const storageKey =
    (
      audio?.storage_key ??
      ''
    ).trim();

  /*
   * Job Base64 cũ không có object key,
   * vì vậy không tạo AudioFile cho job cũ.
   */
  if (
    !audioUrl ||
    !storageKey
  ) {
    console.warn(
      '[RunpodTtsService] Không lưu AudioFile vì thiếu audioUrl hoặc storage_key.',
      {
        ttsJobId,
        hasAudioUrl:
          Boolean(audioUrl),
        hasStorageKey:
          Boolean(storageKey),
      },
    );

    return;
  }

  if (storageKey.length > 500) {
    throw new BadGatewayException(
      'storage_key do worker trả về vượt quá giới hạn.',
    );
  }

  const filename =
    this.sanitizeFilename(
      audio?.filename ??
      `tts-audio-${ttsJobId}.wav`,
    );

  const extensionMatch =
    filename.match(
      /\.([a-zA-Z0-9]{1,20})$/,
    );

  const fileExtension =
    extensionMatch?.[1]
      ?.toLowerCase() ??
    'wav';

  const mimeType =
    (
      audio?.mime_type ??
      'audio/wav'
    )
      .trim()
      .slice(0, 100) ||
    'audio/wav';

  const sizeBytes =
    typeof audio?.size_bytes ===
      'number' &&
    Number.isInteger(
      audio.size_bytes,
    ) &&
    audio.size_bytes > 0
      ? audio.size_bytes
      : null;

  /*
   * Mỗi TtsJob chỉ có một AudioFile.
   * Upsert giúp việc polling nhiều lần
   * không tạo dữ liệu trùng lặp.
   */
  await this.prisma.audioFile.upsert({
    where: {
      ttsJobId,
    },

    create: {
      ttsJobId,

      storageProvider:
        StorageProvider.CLOUDFLARE_R2,

      bucketName:
        this.storageBucketName,

      objectKey:
        storageKey,

      /*
       * Đây là signed URL hiện tại.
       * Nó sẽ được cập nhật/cấp lại
       * ở bước API lịch sử sau.
       */
      publicUrl:
        audioUrl,

      mimeType,

      fileExtension,

      sizeBytes,
    },

    update: {
      storageProvider:
        StorageProvider.CLOUDFLARE_R2,

      bucketName:
        this.storageBucketName,

      objectKey:
        storageKey,

      publicUrl:
        audioUrl,

      mimeType,

      fileExtension,

      sizeBytes,

      /*
       * Nếu bản ghi từng bị xóa mềm,
       * việc xử lý lại job sẽ khôi phục nó.
       */
      deletedAt:
        null,
    },
  });
}

private async syncDatabaseJobStatus(
  databaseJob: {
    id: string;
    status: TtsJobStatus;
    startedAt: Date | null;
    completedAt: Date | null;
  },

  result: RunpodStatusResponse,

  publicStatus: PublicTtsJobStatus,
): Promise<void> {
  const now =
    new Date();

  const modelName =
    result.output?.worker?.model
      ?.trim() || undefined;

  /*
   * RunPod vẫn đang xếp hàng.
   * Bản ghi đã được tạo với trạng thái
   * QUEUED nên không cần ghi database
   * lại sau mỗi lần polling.
   */
  if (publicStatus === 'queued') {
    return;
  }

  if (publicStatus === 'processing') {
    if (
      databaseJob.status ===
        TtsJobStatus.PROCESSING &&
      databaseJob.startedAt
    ) {
      return;
    }

    await this.prisma.ttsJob.update({
      where: {
        id: databaseJob.id,
      },

      data: {
        status:
          TtsJobStatus.PROCESSING,

        startedAt:
          databaseJob.startedAt ??
          now,

        modelName,
      },
    });

    return;
  }

    if (publicStatus === 'completed') {
      /*
      * Luôn upsert metadata trước khi return.
      * Nhờ đó job đã COMPLETED nhưng chưa có
      * AudioFile vẫn có thể được bổ sung.
      */
      await this.upsertAudioFile(
        databaseJob.id,
        result,
      );

      if (
        databaseJob.status ===
          TtsJobStatus.COMPLETED &&
        databaseJob.completedAt
      ) {
        return;
      }

    await this.prisma.ttsJob.update({
      where: {
        id: databaseJob.id,
      },

      data: {
        status:
          TtsJobStatus.COMPLETED,

        startedAt:
          databaseJob.startedAt ??
          now,

        completedAt:
          databaseJob.completedAt ??
          now,

        modelName,

        errorCode:
          null,

        errorMessage:
          null,
      },
    });

    return;
  }

  if (publicStatus === 'failed') {
    const databaseStatus =
      result.status === 'CANCELLED'
        ? TtsJobStatus.CANCELLED
        : TtsJobStatus.FAILED;

    if (
      databaseJob.status ===
        databaseStatus &&
      databaseJob.completedAt
    ) {
      return;
    }

    const workerError =
      this.getSafeWorkerError(
        result,
      );

    const errorMessage =
      workerError ||
      this.getStatusMessage(
        'failed',
        result.status,
      );

    await this.prisma.ttsJob.update({
      where: {
        id: databaseJob.id,
      },

      data: {
        status:
          databaseStatus,

        startedAt:
          databaseJob.startedAt ??
          now,

        completedAt:
          databaseJob.completedAt ??
          now,

        modelName,

        errorCode:
          String(
            result.status,
          ).slice(0, 100),

        errorMessage:
          errorMessage.slice(
            0,
            2000,
          ),
      },
    });
  }
}
async getPublicJobStatus(
  userId: string,
  jobId: string,
  voice: TtsVoice = TtsVoice.MALE,
) {
  /*
   * Không cho tài khoản khác kiểm tra
   * trạng thái bằng RunPod Job ID.
   */
  const databaseJob =
    await this.getOwnedDatabaseJob(
      userId,
      jobId,
    );

  const result =
    await this.getRawJobStatus(
      jobId,
      voice,
    );

  const publicStatus =
    this.mapPublicStatus(
      result,
    );

  /*
   * Đồng bộ trạng thái RunPod
   * vào PostgreSQL.
   */
  await this.syncDatabaseJobStatus(
    databaseJob,
    result,
    publicStatus,
  );

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
    /*
     * UUID nội bộ trong PostgreSQL.
     */
    ttsJobId:
      databaseJob.id,

    /*
     * ID do RunPod cấp.
     */
    jobId:
      result.id ?? jobId,

    status:
      publicStatus,

    runpodStatus:
      result.status,

    message:
      this.getStatusMessage(
        publicStatus,
        result.status,
      ),

    audioReady,

    audioUrl:
      audioReady
        ? (
            `/api/tts/jobs/${jobId}/audio` +
            `?voice=${encodeURIComponent(
              voice,
            )}`
          )
        : null,

    metrics: {
      delayTimeMs:
        result.delayTime ?? null,

      executionTimeMs:
        result.executionTime ?? null,

      sampleRate:
        result.output?.audio
          ?.sample_rate ?? null,

      sizeBytes:
        result.output?.audio
          ?.size_bytes ?? null,

      modelReadySeconds:
        result.output?.timing
          ?.worker_model_ready_seconds ??
        null,

      inferenceSeconds:
        result.output?.timing
          ?.inference_seconds ??
        null,

      requestTotalSeconds:
        result.output?.timing
          ?.request_total_seconds ??
        null,

      gpu:
        result.output?.worker?.gpu ??
        null,
    },

    error:
      publicStatus === 'failed'
        ? this.getSafeWorkerError(
            result,
          )
        : null,
  };
}

async getAudio(
  userId: string,
  jobId: string,
  voice: TtsVoice = TtsVoice.MALE,
): Promise<TtsAudioFile> {
  /*
   * Chỉ chủ sở hữu mới được tải
   * kết quả âm thanh của job.
   */
  const databaseJob =
  await this.getOwnedDatabaseJob(
    userId,
    jobId,
  );

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

    const output =
      result.output;

    /*
    * Đây là lớp dự phòng:
    * nếu polling chưa lưu được AudioFile,
    * lần nghe hoặc tải sẽ thử lưu lại.
    */
    await this.upsertAudioFile(
      databaseJob.id,
      result,
    );

    const filename =
      this.sanitizeFilename(
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
  private createInputHash(
  input: {
    text: string;
    voice: TtsVoice;
    speed: number;
    nfeStep: number;
  },
): string {
  return createHash(
    'sha256',
  )
    .update(
      JSON.stringify(input),
      'utf8',
    )
    .digest('hex');
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