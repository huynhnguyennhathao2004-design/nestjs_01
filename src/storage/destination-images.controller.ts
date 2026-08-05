import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
} from '@nestjs/common';

import type {
  Request,
  Response,
} from 'express';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  DestinationImageStorageService,
} from './destination-image-storage.service';

@Controller('destination-images')
export class DestinationImagesController {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly destinationImageStorageService:
      DestinationImageStorageService,
  ) {}

  /**
   * Đọc ảnh địa điểm từ Cloudflare R2.
   *
   * GET /api/destination-images/:imageId/content
   */
  @Get(':imageId/content')
  async getImageContent(
    @Param(
      'imageId',
      new ParseUUIDPipe({
        version:
          '4',
      }),
    )
    imageId:
      string,

    @Req()
    request:
      Request,

    @Res()
    response:
      Response,
  ) {
    /*
     * Chỉ trả ảnh:
     * - đang hoạt động;
     * - thuộc địa điểm chưa bị xóa mềm;
     * - đã có storageKey trên R2.
     *
     * Địa điểm DRAFT vẫn có thể hiển thị ảnh
     * cho giao diện quản trị xem trước.
     */
    const image =
      await this.prisma
        .destinationImage
        .findFirst({
          where: {
            id:
              imageId,

            isActive:
              true,

            destination: {
              is: {
                deletedAt:
                  null,
              },
            },
          },

          select: {
            id:
              true,

            storageKey:
              true,
          },
        });

    if (
      !image ||
      !image.storageKey
    ) {
      throw new NotFoundException(
        'Không tìm thấy ảnh địa điểm.',
      );
    }

    const downloadedImage =
      await this
        .destinationImageStorageService
        .downloadImage(
          image.storageKey,
        );

    /*
     * Trình duyệt gửi If-None-Match khi
     * đã cache ảnh. Nếu ETag không đổi,
     * trả 304 và không gửi lại toàn bộ file.
     */
    const requestEtag =
      request.get(
        'if-none-match',
      );

    if (
      downloadedImage.etag &&
      requestEtag ===
        downloadedImage.etag
    ) {
      return response
        .status(304)
        .end();
    }

    response.setHeader(
      'Content-Type',
      downloadedImage.mimeType,
    );

    response.setHeader(
      'Content-Length',
      downloadedImage
        .buffer
        .length
        .toString(),
    );

    response.setHeader(
      'Content-Disposition',
      `inline; filename="destination-image-${image.id}.webp"`,
    );

    response.setHeader(
      'Cache-Control',
      `public, max-age=${this.destinationImageStorageService.getCacheSeconds()}`,
    );

    response.setHeader(
      'X-Content-Type-Options',
      'nosniff',
    );

    if (
      downloadedImage.etag
    ) {
      response.setHeader(
        'ETag',
        downloadedImage.etag,
      );
    }

    if (
      downloadedImage.lastModified
    ) {
      response.setHeader(
        'Last-Modified',
        downloadedImage
          .lastModified
          .toUTCString(),
      );
    }

    return response.send(
      downloadedImage.buffer,
    );
  }
}