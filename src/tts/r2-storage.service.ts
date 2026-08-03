import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  ConfigService,
} from '@nestjs/config';

export interface R2AudioObject {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  etag: string | null;
  lastModified: Date | null;
}

interface DeleteR2AudioInput {
  bucketName: string;
  objectKey: string;
}

interface DownloadR2AudioInput {
  bucketName: string;
  objectKey: string;
  fallbackMimeType?: string;
  expectedSizeBytes?: number | null;
}

@Injectable()
export class R2StorageService
  implements
    OnModuleInit,
    OnModuleDestroy
{
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucketName: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly maxOutputBytes: number;

  private client:
    S3Client | null = null;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    this.endpoint =
      (
        this.configService.get<string>(
          'OBJECT_STORAGE_ENDPOINT',
        ) ??
        ''
      )
        .trim()
        .replace(/\/+$/, '');

    this.region =
      (
        this.configService.get<string>(
          'OBJECT_STORAGE_REGION',
        ) ??
        'auto'
      ).trim();

    this.bucketName =
      (
        this.configService.get<string>(
          'OBJECT_STORAGE_BUCKET',
        ) ??
        ''
      ).trim();

    this.accessKeyId =
      (
        this.configService.get<string>(
          'OBJECT_STORAGE_ACCESS_KEY',
        ) ??
        ''
      ).trim();

    this.secretAccessKey =
      (
        this.configService.get<string>(
          'OBJECT_STORAGE_SECRET_KEY',
        ) ??
        ''
      ).trim();

    this.maxOutputBytes =
      this.readPositiveInteger(
        'TTS_MAX_OUTPUT_BYTES',
        50_000_000,
      );
  }

  onModuleInit(): void {
    this.validateConfiguration();

    this.client =
      new S3Client({
        endpoint:
          this.endpoint,

        region:
          this.region,

        credentials: {
          accessKeyId:
            this.accessKeyId,

          secretAccessKey:
            this.secretAccessKey,
        },
      });

    console.log(
      '[R2StorageService] Đã khởi tạo kết nối R2:',
      {
        endpointHost:
          new URL(
            this.endpoint,
          ).hostname,

        region:
          this.region,

        bucketName:
          this.bucketName,
      },
    );
  }

  onModuleDestroy(): void {
    this.client?.destroy();

    this.client =
      null;
  }

  async deleteAudioObject(
  input: DeleteR2AudioInput,
): Promise<void> {
  if (!this.client) {
    throw new InternalServerErrorException(
      'Dịch vụ lưu trữ R2 chưa được khởi tạo.',
    );
  }

  const requestedBucket =
    String(
      input.bucketName ?? '',
    ).trim();

  const objectKey =
    String(
      input.objectKey ?? '',
    ).trim();

  if (
    requestedBucket !==
    this.bucketName
  ) {
    throw new NotFoundException(
      'Không tìm thấy file âm thanh trong bucket hiện tại.',
    );
  }

  if (!objectKey) {
    throw new NotFoundException(
      'File âm thanh chưa có object key.',
    );
  }

  if (
    objectKey.length > 1024 ||
    !objectKey.startsWith(
      'tts/',
    )
  ) {
    throw new BadGatewayException(
      'Object key của file âm thanh không hợp lệ.',
    );
  }

  try {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket:
          this.bucketName,

        Key:
          objectKey,
      }),
    );

    console.log(
      '[R2StorageService] Đã xóa object khỏi R2:',
      {
        objectKey,
      },
    );
  } catch (error: unknown) {
    const errorRecord =
      error &&
      typeof error === 'object'
        ? (
            error as {
              name?: unknown;
              code?: unknown;

              $metadata?: {
                httpStatusCode?: number;
              };
            }
          )
        : null;

    const errorName =
      typeof errorRecord?.name ===
        'string'
        ? errorRecord.name
        : '';

    const errorCode =
      typeof errorRecord?.code ===
        'string'
        ? errorRecord.code
        : '';

    const httpStatus =
      errorRecord?.$metadata
        ?.httpStatusCode;

    /*
     * Xóa object không còn tồn tại vẫn
     * được xem là đã đạt kết quả mong muốn.
     */
    if (
      httpStatus === 404 ||
      errorName === 'NoSuchKey' ||
      errorName === 'NotFound'
    ) {
      return;
    }

    if (
      errorName === 'TimeoutError' ||
      errorName === 'RequestTimeout' ||
      errorCode === 'ETIMEDOUT'
    ) {
      throw new GatewayTimeoutException(
        'Quá thời gian xóa file khỏi Cloudflare R2.',
      );
    }

    if (
      httpStatus === 401 ||
      httpStatus === 403
    ) {
      throw new BadGatewayException(
        'Credential Cloudflare R2 không có quyền xóa object.',
      );
    }

    console.error(
      '[R2StorageService] Không thể xóa object:',
      {
        objectKey,

        errorName:
          errorName ||
          'UnknownError',

        httpStatus:
          httpStatus ??
          null,
      },
    );

    throw new BadGatewayException(
      'Không thể xóa file âm thanh khỏi Cloudflare R2.',
    );
  }
}

  async downloadAudioObject(
    input: DownloadR2AudioInput,
  ): Promise<R2AudioObject> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Dịch vụ lưu trữ R2 chưa được khởi tạo.',
      );
    }

    const requestedBucket =
      String(
        input.bucketName ?? '',
      ).trim();

    const objectKey =
      String(
        input.objectKey ?? '',
      ).trim();

    /*
     * Không cho dữ liệu database điều hướng
     * backend sang bucket khác.
     */
    if (
      requestedBucket !==
      this.bucketName
    ) {
      throw new NotFoundException(
        'Không tìm thấy file âm thanh trong bucket hiện tại.',
      );
    }

    if (!objectKey) {
      throw new NotFoundException(
        'File âm thanh chưa có object key.',
      );
    }

    if (
      objectKey.length > 1024
    ) {
      throw new BadGatewayException(
        'Object key của file âm thanh vượt quá giới hạn.',
      );
    }

    /*
     * Worker của dự án hiện lưu tất cả
     * file âm thanh trong thư mục tts/.
     */
    if (
      !objectKey.startsWith(
        'tts/',
      )
    ) {
      throw new BadGatewayException(
        'Object key của file âm thanh không hợp lệ.',
      );
    }

    try {
      const response =
        await this.client.send(
          new GetObjectCommand({
            Bucket:
              this.bucketName,

            Key:
              objectKey,
          }),
        );

      if (!response.Body) {
        throw new BadGatewayException(
          'Cloudflare R2 không trả về nội dung file.',
        );
      }

      const declaredSize =
        typeof response.ContentLength ===
          'number'
          ? response.ContentLength
          : null;

      if (
        declaredSize !== null &&
        declaredSize >
          this.maxOutputBytes
      ) {
        throw new BadGatewayException(
          'File âm thanh trên R2 vượt quá giới hạn cho phép.',
        );
      }

      const byteArray =
        await response.Body
          .transformToByteArray();

      const buffer =
        Buffer.from(
          byteArray,
        );

      if (
        buffer.length === 0
      ) {
        throw new BadGatewayException(
          'File âm thanh trên R2 đang trống.',
        );
      }

      if (
        buffer.length >
        this.maxOutputBytes
      ) {
        throw new BadGatewayException(
          'File âm thanh trên R2 vượt quá giới hạn cho phép.',
        );
      }

      /*
       * Kiểm tra kích thước lưu trong database
       * nếu metadata đã tồn tại.
       */
      if (
        typeof input.expectedSizeBytes ===
          'number' &&
        input.expectedSizeBytes > 0 &&
        input.expectedSizeBytes !==
          buffer.length
      ) {
        throw new BadGatewayException(
          'Kích thước file trên R2 không khớp với metadata.',
        );
      }

      if (
        declaredSize !== null &&
        declaredSize > 0 &&
        declaredSize !==
          buffer.length
      ) {
        throw new BadGatewayException(
          'Kích thước file tải từ R2 không khớp với Content-Length.',
        );
      }

      const fallbackMimeType =
        String(
          input.fallbackMimeType ??
          'audio/wav',
        )
          .trim()
          .slice(
            0,
            100,
          ) ||
        'audio/wav';

      const responseMimeType =
        String(
          response.ContentType ??
          '',
        )
          .trim()
          .slice(
            0,
            100,
          );

      const mimeType =
        responseMimeType ||
        fallbackMimeType;

      return {
        buffer,

        mimeType,

        sizeBytes:
          buffer.length,

        etag:
          response.ETag ??
          null,

        lastModified:
          response.LastModified ??
          null,
      };
    } catch (error: unknown) {
      /*
       * Giữ nguyên exception do service
       * chủ động tạo ra.
       */
      if (
        error instanceof
          BadGatewayException ||
        error instanceof
          NotFoundException ||
        error instanceof
          GatewayTimeoutException ||
        error instanceof
          InternalServerErrorException
      ) {
        throw error;
      }

      const errorRecord =
        error &&
        typeof error === 'object'
          ? (
              error as {
                name?: unknown;
                code?: unknown;

                $metadata?: {
                  httpStatusCode?: number;
                };
              }
            )
          : null;

      const errorName =
        typeof errorRecord?.name ===
          'string'
          ? errorRecord.name
          : '';

      const errorCode =
        typeof errorRecord?.code ===
          'string'
          ? errorRecord.code
          : '';

      const httpStatus =
        errorRecord?.$metadata
          ?.httpStatusCode;

      if (
        httpStatus === 404 ||
        errorName === 'NoSuchKey' ||
        errorName ===
          'NotFound'
      ) {
        throw new NotFoundException(
          'File âm thanh không còn tồn tại trên Cloudflare R2.',
        );
      }

      if (
        errorName ===
          'TimeoutError' ||
        errorName ===
          'RequestTimeout' ||
        errorCode ===
          'ETIMEDOUT' ||
        errorCode ===
          'ECONNABORTED'
      ) {
        throw new GatewayTimeoutException(
          'Quá thời gian đọc file âm thanh từ Cloudflare R2.',
        );
      }

      console.error(
        '[R2StorageService] Không thể đọc object:',
        {
          objectKey,
          errorName:
            errorName ||
            'UnknownError',

          httpStatus:
            httpStatus ??
            null,
        },
      );

      throw new BadGatewayException(
        'Không thể đọc file âm thanh từ Cloudflare R2.',
      );
    }
  }

  private validateConfiguration(): void {
    const missingVariables:
      string[] = [];

    if (!this.endpoint) {
      missingVariables.push(
        'OBJECT_STORAGE_ENDPOINT',
      );
    }

    if (!this.region) {
      missingVariables.push(
        'OBJECT_STORAGE_REGION',
      );
    }

    if (!this.bucketName) {
      missingVariables.push(
        'OBJECT_STORAGE_BUCKET',
      );
    }

    if (!this.accessKeyId) {
      missingVariables.push(
        'OBJECT_STORAGE_ACCESS_KEY',
      );
    }

    if (!this.secretAccessKey) {
      missingVariables.push(
        'OBJECT_STORAGE_SECRET_KEY',
      );
    }

    if (
      missingVariables.length > 0
    ) {
      throw new Error(
        'Thiếu cấu hình Cloudflare R2: ' +
        missingVariables.join(
          ', ',
        ),
      );
    }

    let parsedEndpoint: URL;

    try {
      parsedEndpoint =
        new URL(
          this.endpoint,
        );
    } catch {
      throw new Error(
        'OBJECT_STORAGE_ENDPOINT không phải URL hợp lệ.',
      );
    }

    if (
      parsedEndpoint.protocol !==
      'https:'
    ) {
      throw new Error(
        'OBJECT_STORAGE_ENDPOINT phải sử dụng HTTPS.',
      );
    }

    if (
      !parsedEndpoint.hostname.endsWith(
        '.r2.cloudflarestorage.com',
      )
    ) {
      throw new Error(
        'OBJECT_STORAGE_ENDPOINT không phải endpoint Cloudflare R2 hợp lệ.',
      );
    }
  }

  private readPositiveInteger(
    variableName: string,
    fallbackValue: number,
  ): number {
    const rawValue =
      this.configService.get<string>(
        variableName,
      );

    const parsedValue =
      Number(
        rawValue,
      );

    if (
      !Number.isInteger(
        parsedValue,
      ) ||
      parsedValue <= 0
    ) {
      return fallbackValue;
    }

    return parsedValue;
  }
}