import {
  BadGatewayException,
  BadRequestException,
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
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  ConfigService,
} from '@nestjs/config';

import {
  randomUUID,
} from 'node:crypto';

import sharp from 'sharp';

export interface UploadDestinationImageInput {
  destinationId: string;
  buffer: Buffer;
  mimeType?: string;
  originalName?: string;
}

export interface UploadedDestinationImage {
  objectKey: string;
  mimeType: 'image/webp';
  fileExtension: 'webp';
  sizeBytes: number;
  width: number;
  height: number;
  etag: string | null;
}

export interface DownloadedDestinationImage {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  etag: string | null;
  lastModified: Date | null;
}

@Injectable()
export class DestinationImageStorageService
  implements
    OnModuleInit,
    OnModuleDestroy
{
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucketName: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  private readonly maxInputBytes: number;
  private readonly maxOutputBytes: number;
  private readonly webpQuality: number;
  private readonly cacheSeconds: number;
  private readonly maxDimension: number;

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
        .replace(
          /\/+$/,
          '',
        );

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

    this.maxInputBytes =
      this.readInteger(
        'DESTINATION_IMAGE_MAX_BYTES',
        10_485_760,
        1_048_576,
        25_000_000,
      );

    /*
     * Ảnh WebP sau xử lý không được lớn
     * hơn giới hạn file đầu vào.
     */
    this.maxOutputBytes =
      this.maxInputBytes;

    this.webpQuality =
      this.readInteger(
        'DESTINATION_IMAGE_WEBP_QUALITY',
        82,
        40,
        95,
      );

    this.cacheSeconds =
      this.readInteger(
        'DESTINATION_IMAGE_CACHE_SECONDS',
        86_400,
        60,
        31_536_000,
      );

    /*
     * Cạnh dài nhất của ảnh sau xử lý.
     * 2400px đủ cho ảnh bìa desktop.
     */
    this.maxDimension =
      2400;
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
      '[DestinationImageStorageService] Đã khởi tạo kết nối R2:',
      {
        endpointHost:
          new URL(
            this.endpoint,
          ).hostname,

        region:
          this.region,

        bucketName:
          this.bucketName,

        maxInputBytes:
          this.maxInputBytes,

        webpQuality:
          this.webpQuality,
      },
    );
  }

  onModuleDestroy(): void {
    this.client?.destroy();

    this.client =
      null;
  }

  async processAndUpload(
    input:
      UploadDestinationImageInput,
  ): Promise<UploadedDestinationImage> {
    const client =
      this.getClient();

    const destinationId =
      String(
        input.destinationId ??
        '',
      ).trim();

    if (
      !this.isUuid(
        destinationId,
      )
    ) {
      throw new BadRequestException(
        'destinationId của ảnh không hợp lệ.',
      );
    }

    if (
      !Buffer.isBuffer(
        input.buffer,
      ) ||
      input.buffer.length === 0
    ) {
      throw new BadRequestException(
        'File ảnh tải lên đang trống.',
      );
    }

    if (
      input.buffer.length >
      this.maxInputBytes
    ) {
      throw new BadRequestException(
        'Dung lượng file ảnh vượt quá giới hạn cho phép.',
      );
    }

    const submittedMimeType =
      String(
        input.mimeType ??
        '',
      )
        .trim()
        .toLowerCase();

    const allowedMimeTypes =
      new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ]);

    if (
      submittedMimeType &&
      !allowedMimeTypes.has(
        submittedMimeType,
      )
    ) {
      throw new BadRequestException(
        'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.',
      );
    }

    let processedBuffer:
      Buffer;

    let processedWidth:
      number;

    let processedHeight:
      number;

    try {
      /*
       * rotate() đọc thông tin EXIF và xoay ảnh
       * về đúng chiều trước khi xóa metadata.
       */
      const processedResult =
        await sharp(
          input.buffer,
          {
            failOn:
              'error',

            /*
             * Ngăn ảnh có số pixel quá lớn
             * làm tiêu tốn quá nhiều bộ nhớ.
             */
            limitInputPixels:
              40_000_000,
          },
        )
          .rotate()
          .resize({
            width:
              this.maxDimension,

            height:
              this.maxDimension,

            fit:
              'inside',

            withoutEnlargement:
              true,
          })
          .webp({
            quality:
              this.webpQuality,

            effort:
              4,

            smartSubsample:
              true,
          })
          .toBuffer({
            resolveWithObject:
              true,
          });

      processedBuffer =
        processedResult.data;

      processedWidth =
        processedResult.info.width;

      processedHeight =
        processedResult.info.height;
    } catch (error: unknown) {
      console.error(
        '[DestinationImageStorageService] Không thể xử lý ảnh:',
        {
          error:
            error instanceof Error
              ? error.message
              : 'UnknownError',
        },
      );

      throw new BadRequestException(
        'File tải lên không phải ảnh hợp lệ hoặc ảnh đã bị hỏng.',
      );
    }

    if (
      processedBuffer.length === 0
    ) {
      throw new BadGatewayException(
        'Ảnh sau khi xử lý đang trống.',
      );
    }

    if (
      processedBuffer.length >
      this.maxOutputBytes
    ) {
      throw new BadRequestException(
        'Ảnh sau khi xử lý vẫn vượt quá giới hạn dung lượng.',
      );
    }

    if (
      !processedWidth ||
      !processedHeight
    ) {
      throw new BadGatewayException(
        'Không xác định được kích thước ảnh sau xử lý.',
      );
    }

    const objectKey =
      [
        'destinations',
        destinationId,
        `${randomUUID()}.webp`,
      ].join('/');

    try {
      const response =
        await client.send(
          new PutObjectCommand({
            Bucket:
              this.bucketName,

            Key:
              objectKey,

            Body:
              processedBuffer,

            ContentType:
              'image/webp',

            CacheControl:
              `public, max-age=${this.cacheSeconds}, immutable`,

            Metadata: {
              destinationid:
                destinationId,

              convertedto:
                'webp',
            },
          }),
        );

      console.log(
        '[DestinationImageStorageService] Đã upload ảnh lên R2:',
        {
          destinationId,
          objectKey,

          sizeBytes:
            processedBuffer.length,

          width:
            processedWidth,

          height:
            processedHeight,
        },
      );

      return {
        objectKey,

        mimeType:
          'image/webp',

        fileExtension:
          'webp',

        sizeBytes:
          processedBuffer.length,

        width:
          processedWidth,

        height:
          processedHeight,

        etag:
          response.ETag ??
          null,
      };
    } catch (error: unknown) {
      this.throwStorageError(
        error,
        'upload',
        objectKey,
      );
    }
  }

  async downloadImage(
    objectKeyValue: string,
  ): Promise<DownloadedDestinationImage> {
    const client =
      this.getClient();

    const objectKey =
      this.normalizeObjectKey(
        objectKeyValue,
      );

    try {
      const response =
        await client.send(
          new GetObjectCommand({
            Bucket:
              this.bucketName,

            Key:
              objectKey,
          }),
        );

      if (!response.Body) {
        throw new BadGatewayException(
          'Cloudflare R2 không trả về nội dung ảnh.',
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
          'Ảnh trên Cloudflare R2 vượt quá giới hạn cho phép.',
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
          'Ảnh trên Cloudflare R2 đang trống.',
        );
      }

      if (
        buffer.length >
        this.maxOutputBytes
      ) {
        throw new BadGatewayException(
          'Ảnh trên Cloudflare R2 vượt quá giới hạn cho phép.',
        );
      }

      if (
        declaredSize !== null &&
        declaredSize > 0 &&
        declaredSize !==
          buffer.length
      ) {
        throw new BadGatewayException(
          'Kích thước ảnh tải về không khớp với Content-Length.',
        );
      }

      const mimeType =
        String(
          response.ContentType ??
          'image/webp',
        )
          .trim()
          .slice(
            0,
            100,
          ) ||
        'image/webp';

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

      this.throwStorageError(
        error,
        'download',
        objectKey,
      );
    }
  }

  async deleteImageObject(
    objectKeyValue: string,
  ): Promise<void> {
    const client =
      this.getClient();

    const objectKey =
      this.normalizeObjectKey(
        objectKeyValue,
      );

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket:
            this.bucketName,

          Key:
            objectKey,
        }),
      );

      console.log(
        '[DestinationImageStorageService] Đã xóa ảnh khỏi R2:',
        {
          objectKey,
        },
      );
    } catch (error: unknown) {
      const errorInfo =
        this.getStorageErrorInfo(
          error,
        );

      /*
       * Object đã không còn tồn tại thì xem
       * như mục tiêu xóa đã hoàn thành.
       */
      if (
        errorInfo.httpStatus === 404 ||
        errorInfo.errorName ===
          'NoSuchKey' ||
        errorInfo.errorName ===
          'NotFound'
      ) {
        return;
      }

      this.throwStorageError(
        error,
        'delete',
        objectKey,
      );
    }
  }

  getConfiguredBucketName(): string {
    return this.bucketName;
  }

  getCacheSeconds(): number {
    return this.cacheSeconds;
  }

  private getClient(): S3Client {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Dịch vụ lưu trữ ảnh chưa được khởi tạo.',
      );
    }

    return this.client;
  }

  private normalizeObjectKey(
    value: string,
  ): string {
    const objectKey =
      String(
        value ??
        '',
      ).trim();

    if (!objectKey) {
      throw new NotFoundException(
        'Ảnh chưa có storage key.',
      );
    }

    if (
      objectKey.length > 1024 ||
      !objectKey.startsWith(
        'destinations/',
      )
    ) {
      throw new BadRequestException(
        'Storage key của ảnh địa điểm không hợp lệ.',
      );
    }

    if (
      objectKey.includes(
        '..',
      ) ||
      objectKey.includes(
        '\\',
      )
    ) {
      throw new BadRequestException(
        'Storage key của ảnh địa điểm không an toàn.',
      );
    }

    return objectKey;
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
        'Thiếu cấu hình lưu trữ ảnh Cloudflare R2: ' +
        missingVariables.join(
          ', ',
        ),
      );
    }

    let parsedEndpoint:
      URL;

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

  private isUuid(
    value: string,
  ): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        value,
      );
  }

  private readInteger(
    variableName: string,
    fallbackValue: number,
    minimumValue: number,
    maximumValue: number,
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
      parsedValue <
        minimumValue ||
      parsedValue >
        maximumValue
    ) {
      return fallbackValue;
    }

    return parsedValue;
  }

  private getStorageErrorInfo(
    error: unknown,
  ): {
    errorName: string;
    errorCode: string;
    httpStatus: number | null;
  } {
    const errorRecord =
      error &&
      typeof error ===
        'object'
        ? (
            error as {
              name?: unknown;
              code?: unknown;

              $metadata?: {
                httpStatusCode?:
                  number;
              };
            }
          )
        : null;

    return {
      errorName:
        typeof errorRecord?.name ===
          'string'
          ? errorRecord.name
          : '',

      errorCode:
        typeof errorRecord?.code ===
          'string'
          ? errorRecord.code
          : '',

      httpStatus:
        typeof errorRecord
          ?.$metadata
          ?.httpStatusCode ===
          'number'
          ? errorRecord
              .$metadata
              .httpStatusCode
          : null,
    };
  }

  private throwStorageError(
    error: unknown,
    operation:
      'upload' |
      'download' |
      'delete',
    objectKey: string,
  ): never {
    const errorInfo =
      this.getStorageErrorInfo(
        error,
      );

    if (
      operation === 'download' &&
      (
        errorInfo.httpStatus ===
          404 ||
        errorInfo.errorName ===
          'NoSuchKey' ||
        errorInfo.errorName ===
          'NotFound'
      )
    ) {
      throw new NotFoundException(
        'Ảnh không còn tồn tại trên Cloudflare R2.',
      );
    }

    if (
      errorInfo.errorName ===
        'TimeoutError' ||
      errorInfo.errorName ===
        'RequestTimeout' ||
      errorInfo.errorCode ===
        'ETIMEDOUT' ||
      errorInfo.errorCode ===
        'ECONNABORTED'
    ) {
      throw new GatewayTimeoutException(
        'Quá thời gian kết nối tới Cloudflare R2.',
      );
    }

    if (
      errorInfo.httpStatus ===
        401 ||
      errorInfo.httpStatus ===
        403
    ) {
      throw new BadGatewayException(
        operation === 'delete'
          ? 'Credential Cloudflare R2 không có quyền xóa ảnh.'
          : 'Credential Cloudflare R2 không có quyền thao tác với ảnh.',
      );
    }

    console.error(
      '[DestinationImageStorageService] Thao tác R2 thất bại:',
      {
        operation,
        objectKey,

        errorName:
          errorInfo.errorName ||
          'UnknownError',

        httpStatus:
          errorInfo.httpStatus,
      },
    );

    const operationMessages = {
      upload:
        'Không thể tải ảnh lên Cloudflare R2.',

      download:
        'Không thể đọc ảnh từ Cloudflare R2.',

      delete:
        'Không thể xóa ảnh khỏi Cloudflare R2.',
    };

    throw new BadGatewayException(
      operationMessages[
        operation
      ],
    );
  }
}