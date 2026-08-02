import {
  Transform,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Chuẩn hóa query string:
 *
 * - Xóa khoảng trắng đầu và cuối.
 * - Chuỗi rỗng trở thành undefined.
 * - Giá trị "all" trở thành undefined.
 *
 * Frontend hiện tại đang sử dụng "all" để biểu thị
 * trạng thái không áp dụng bộ lọc.
 */
function normalizeOptionalFilter(
  params: TransformFnParams,
): unknown {
  const value = params.value;

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  if (
    !normalizedValue ||
    normalizedValue.toLowerCase() === 'all'
  ) {
    return undefined;
  }

  return normalizedValue;
}

export class FindDestinationsQueryDto {
  /**
   * Từ khóa tìm kiếm.
   *
   * Ví dụ:
   * q=Đà Lạt
   * q=da lat
   */
  @Transform(normalizeOptionalFilter)
  @IsOptional()
  @IsString()
  @MaxLength(180)
  q?: string;

  /**
   * Tên hoặc slug của vùng miền.
   *
   * Ví dụ:
   * region=Miền Trung
   * region=mien-trung
   */
  @Transform(normalizeOptionalFilter)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  /**
   * Tên hoặc slug của danh mục.
   *
   * Ví dụ:
   * category=Biển đảo
   * category=bien-dao
   */
  @Transform(normalizeOptionalFilter)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  category?: string;
}