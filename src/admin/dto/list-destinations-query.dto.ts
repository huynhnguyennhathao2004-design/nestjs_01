import {
  Transform,
  Type,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  DestinationStatus,
} from '../../generated/prisma/enums';

function normalizeOptionalString(
  params: TransformFnParams,
): unknown {
  if (typeof params.value !== 'string') {
    return params.value;
  }

  const normalizedValue =
    params.value.trim();

  if (
    !normalizedValue ||
    normalizedValue.toLowerCase() === 'all'
  ) {
    return undefined;
  }

  return normalizedValue;
}

export class ListDestinationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Trang phải là số nguyên.',
  })
  @Min(1, {
    message:
      'Trang phải lớn hơn hoặc bằng 1.',
  })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      'Giới hạn phải là số nguyên.',
  })
  @Min(1, {
    message:
      'Giới hạn phải lớn hơn hoặc bằng 1.',
  })
  @Max(100, {
    message:
      'Mỗi trang chỉ được tối đa 100 địa điểm.',
  })
  limit: number = 20;

  @Transform(normalizeOptionalString)
  @IsOptional()
  @IsString({
    message:
      'Từ khóa tìm kiếm phải là chuỗi.',
  })
  @MaxLength(180, {
    message:
      'Từ khóa tìm kiếm quá dài.',
  })
  search?: string;

  @Transform(normalizeOptionalString)
  @IsOptional()
  @IsEnum(DestinationStatus, {
    message:
      'Trạng thái địa điểm không hợp lệ.',
  })
  status?: DestinationStatus;

  @Transform(normalizeOptionalString)
  @IsOptional()
  @IsString({
    message:
      'Vùng miền phải là chuỗi.',
  })
  @MaxLength(120, {
    message:
      'Tên vùng miền quá dài.',
  })
  region?: string;

  @Transform(normalizeOptionalString)
  @IsOptional()
  @IsString({
    message:
      'Danh mục phải là chuỗi.',
  })
  @MaxLength(140, {
    message:
      'Tên danh mục quá dài.',
  })
  category?: string;

  /**
   * ACTIVE: chỉ địa điểm chưa xóa.
   * DELETED: chỉ địa điểm trong thùng rác.
   * ALL: lấy cả hai.
   */
  @Transform(normalizeOptionalString)
  @IsOptional()
  @IsIn(
    ['ACTIVE', 'DELETED', 'ALL'],
    {
      message:
        'Bộ lọc deleted chỉ chấp nhận ACTIVE, DELETED hoặc ALL.',
    },
  )
  deleted?:
    | 'ACTIVE'
    | 'DELETED'
    | 'ALL';
}