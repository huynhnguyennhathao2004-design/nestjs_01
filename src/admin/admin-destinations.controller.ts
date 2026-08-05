import {
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { AdminDestinationsService } from './admin-destinations.service';

import { CreateDestinationDto } from './dto/create-destination.dto';
import { CreateDestinationAttractionDto } from './dto/create-destination-attraction.dto';
import { CreateDestinationFeatureDto } from './dto/create-destination-feature.dto';
import { CreateDestinationFoodDto } from './dto/create-destination-food.dto';
import { CreateDestinationImageDto } from './dto/create-destination-image.dto';

import { ListDestinationsQueryDto } from './dto/list-destinations-query.dto';

import { UpdateDestinationDto } from './dto/update-destination.dto';
import { UpdateDestinationAttractionDto } from './dto/update-destination-attraction.dto';
import { UpdateDestinationFeaturedDto } from './dto/update-destination-featured.dto';
import { UpdateDestinationFeatureDto } from './dto/update-destination-feature.dto';
import { UpdateDestinationFoodDto } from './dto/update-destination-food.dto';
import { UpdateDestinationImageDto } from './dto/update-destination-image.dto';
import { UpdateDestinationStatusDto } from './dto/update-destination-status.dto';

import { AdminGuard } from './guards/admin.guard';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  UploadDestinationImageDto,
} from './dto/upload-destination-image.dto';



@Controller('admin/destinations')
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
)
export class AdminDestinationsController {
  constructor(
    private readonly adminDestinationsService:
      AdminDestinationsService,
  ) {}

  private getRequestInfo(
    request: Request,
  ): {
    ipAddress: string | null;
    userAgent: string | null;
  } {
    const userAgentHeader =
      request.headers['user-agent'];

    return {
      ipAddress:
        request.ip ||
        request.socket.remoteAddress ||
        null,

      userAgent:
        typeof userAgentHeader === 'string'
          ? userAgentHeader
          : null,
    };
  }

  @Get()
  findAll(
    @Query()
    query: ListDestinationsQueryDto,
  ) {
    return this.adminDestinationsService.findAll(
      query,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Body()
    dto: CreateDestinationDto,
  ) {
    return this.adminDestinationsService.create(
      currentAdmin.id,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: UpdateDestinationStatusDto,
  ) {
    return this.adminDestinationsService.updateStatus(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id/featured')
  @HttpCode(HttpStatus.OK)
  updateFeatured(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: UpdateDestinationFeaturedDto,
  ) {
    return this.adminDestinationsService.updateFeatured(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,
  ) {
    return this.adminDestinationsService.restore(
      currentAdmin.id,
      destinationId,
      this.getRequestInfo(request),
    );
  }

  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  createImage(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: CreateDestinationImageDto,
  ) {
    return this.adminDestinationsService.createImage(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

/**
 * Upload file ảnh địa điểm lên Cloudflare R2.
 *
 * POST /api/admin/destinations/:id/images/upload
 */
@Post(':id/images/upload')
@HttpCode(HttpStatus.CREATED)
@UseInterceptors(
  FileInterceptor(
    'file',
    {
      limits: {
        files:
          1,

        fileSize:
          10_485_760,
      },

      fileFilter: (
        _request:
          Request,

        file:
          Express.Multer.File,

        callback: (
          error:
            Error | null,

          acceptFile:
            boolean,
        ) => void,
      ) => {
        const allowedMimeTypes =
          new Set([
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ]);

        if (
          !allowedMimeTypes.has(
            String(
              file.mimetype ??
              '',
            )
              .trim()
              .toLowerCase(),
          )
        ) {
          callback(
            new BadRequestException(
              'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.',
            ),
            false,
          );

          return;
        }

        callback(
          null,
          true,
        );
      },
    },
  ),
)
uploadImage(
  @CurrentUser()
  currentAdmin:
    AuthenticatedUser,

  @Req()
  request:
    Request,

  @Param(
    'id',
    new ParseUUIDPipe({
      version:
        '4',
    }),
  )
  destinationId:
    string,

  @UploadedFile()
  file:
    Express.Multer.File |
    undefined,

  @Body()
  dto:
    UploadDestinationImageDto,
) {
  if (!file) {
    throw new BadRequestException(
      'Bạn chưa chọn file ảnh cần tải lên.',
    );
  }

  return this
    .adminDestinationsService
    .uploadImage(
      currentAdmin.id,
      destinationId,
      file,
      dto,
      this.getRequestInfo(
        request,
      ),
    );
}

  @Patch(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  updateImage(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'imageId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    imageId: string,

    @Body()
    dto: UpdateDestinationImageDto,
  ) {
    return this.adminDestinationsService.updateImage(
      currentAdmin.id,
      destinationId,
      imageId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  deleteImage(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'imageId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    imageId: string,
  ) {
    return this.adminDestinationsService.deleteImage(
      currentAdmin.id,
      destinationId,
      imageId,
      this.getRequestInfo(request),
    );
  }

  @Post(':id/features')
  @HttpCode(HttpStatus.CREATED)
  createFeature(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: CreateDestinationFeatureDto,
  ) {
    return this.adminDestinationsService.createFeature(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id/features/:featureId')
  @HttpCode(HttpStatus.OK)
  updateFeature(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'featureId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    featureId: string,

    @Body()
    dto: UpdateDestinationFeatureDto,
  ) {
    return this.adminDestinationsService.updateFeature(
      currentAdmin.id,
      destinationId,
      featureId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Delete(':id/features/:featureId')
  @HttpCode(HttpStatus.OK)
  deleteFeature(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'featureId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    featureId: string,
  ) {
    return this.adminDestinationsService.deleteFeature(
      currentAdmin.id,
      destinationId,
      featureId,
      this.getRequestInfo(request),
    );
  }

  @Post(':id/attractions')
  @HttpCode(HttpStatus.CREATED)
  createAttraction(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: CreateDestinationAttractionDto,
  ) {
    return this.adminDestinationsService.createAttraction(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id/attractions/:attractionId')
  @HttpCode(HttpStatus.OK)
  updateAttraction(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'attractionId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    attractionId: string,

    @Body()
    dto: UpdateDestinationAttractionDto,
  ) {
    return this.adminDestinationsService.updateAttraction(
      currentAdmin.id,
      destinationId,
      attractionId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Delete(':id/attractions/:attractionId')
  @HttpCode(HttpStatus.OK)
  deleteAttraction(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'attractionId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    attractionId: string,
  ) {
    return this.adminDestinationsService.deleteAttraction(
      currentAdmin.id,
      destinationId,
      attractionId,
      this.getRequestInfo(request),
    );
  }

  @Post(':id/foods')
  @HttpCode(HttpStatus.CREATED)
  createFood(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: CreateDestinationFoodDto,
  ) {
    return this.adminDestinationsService.createFood(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id/foods/:foodId')
  @HttpCode(HttpStatus.OK)
  updateFood(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'foodId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    foodId: string,

    @Body()
    dto: UpdateDestinationFoodDto,
  ) {
    return this.adminDestinationsService.updateFood(
      currentAdmin.id,
      destinationId,
      foodId,
      dto,
      this.getRequestInfo(request),
    );
  }

  @Delete(':id/foods/:foodId')
  @HttpCode(HttpStatus.OK)
  deleteFood(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Param(
      'foodId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    foodId: string,
  ) {
    return this.adminDestinationsService.deleteFood(
      currentAdmin.id,
      destinationId,
      foodId,
      this.getRequestInfo(request),
    );
  }

  /**
 * DELETE /api/admin/destinations/trash/permanent
 *
 * Xóa vĩnh viễn toàn bộ địa điểm
 * hiện có trong thùng rác.
 */
@Delete('trash/permanent')
@HttpCode(HttpStatus.OK)
hardDeleteAll(
  @CurrentUser()
  currentAdmin:
    AuthenticatedUser,

  @Req()
  request: Request,
) {
  return this
    .adminDestinationsService
    .hardDeleteAll(
      currentAdmin.id,

      this.getRequestInfo(
        request,
      ),
    );
}
  /**
   * DELETE /api/admin/destinations/:id/permanent
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  hardDelete(
    @CurrentUser()
    currentAdmin:
      AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,
  ) {
    return this
      .adminDestinationsService
      .hardDelete(
        currentAdmin.id,
        destinationId,
        this.getRequestInfo(
          request,
        ),
      );
  }
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  softDelete(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,
  ) {
    return this.adminDestinationsService.softDelete(
      currentAdmin.id,
      destinationId,
      this.getRequestInfo(request),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser()
    currentAdmin: AuthenticatedUser,

    @Req()
    request: Request,

    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,

    @Body()
    dto: UpdateDestinationDto,
  ) {
    return this.adminDestinationsService.update(
      currentAdmin.id,
      destinationId,
      dto,
      this.getRequestInfo(request),
    );
  }

    /**
   * GET /api/admin/destinations/form-options
   */
  @Get('form-options')
  getFormOptions() {
    return this
      .adminDestinationsService
      .getFormOptions();
  }
  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    destinationId: string,
  ) {
    return this.adminDestinationsService.findOne(
      destinationId,
    );
  }
}