import {
  Transform,
  Type,
  type TransformFnParams,
} from 'class-transformer';

import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimRequiredString(
  params: TransformFnParams,
): unknown {
  if (
    typeof params.value !== 'string'
  ) {
    return params.value;
  }

  return params.value.trim();
}

function trimOptionalString(
  params: TransformFnParams,
): unknown {
  if (
    typeof params.value !== 'string'
  ) {
    return params.value;
  }

  const normalizedValue =
    params.value.trim();

  return normalizedValue || undefined;
}

export class CreateDestinationDto {
  @Transform(trimRequiredString)
  @IsString({
    message:
      'Tên địa điểm phải là chuỗi.',
  })
  @MinLength(2, {
    message:
      'Tên địa điểm phải có ít nhất 2 ký tự.',
  })
  @MaxLength(180, {
    message:
      'Tên địa điểm không được vượt quá 180 ký tự.',
  })
  name!: string;

  /**
   * Có thể bỏ trống.
   * Backend sẽ tự tạo slug từ tên.
   */
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString({
    message:
      'Slug phải là chuỗi.',
  })
  @MaxLength(180, {
    message:
      'Slug không được vượt quá 180 ký tự.',
  })
  slug?: string;

  @IsUUID('4', {
    message:
      'ID tỉnh/thành không hợp lệ.',
  })
  provinceId!: string;

  @IsUUID('4', {
    message:
      'ID danh mục chính không hợp lệ.',
  })
  primaryCategoryId!: string;

  /**
   * Các danh mục phụ.
   *
   * Backend sẽ tự thêm primaryCategoryId
   * nếu danh sách này chưa chứa nó.
   */
  @IsOptional()
  @IsArray({
    message:
      'Danh sách danh mục phải là một mảng.',
  })
  @ArrayUnique({
    message:
      'Danh sách danh mục không được chứa ID trùng.',
  })
  @IsUUID('4', {
    each: true,
    message:
      'Danh sách có ID danh mục không hợp lệ.',
  })
  categoryIds?: string[];

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message:
      'Mô tả ngắn không được vượt quá 500 ký tự.',
  })
  shortDescription?: string;

  @Transform(trimRequiredString)
  @IsString({
    message:
      'Nội dung giới thiệu phải là chuỗi.',
  })
  @MinLength(10, {
    message:
      'Nội dung giới thiệu phải có ít nhất 10 ký tự.',
  })
  description!: string;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message:
      'Thời điểm du lịch không được vượt quá 255 ký tự.',
  })
  bestTravelTime?: string;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message:
      'Thông tin bản đồ quá dài.',
  })
  mapQuery?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 6,
    },
    {
      message:
        'Vĩ độ phải là một số.',
    },
  )
  @Min(-90, {
    message:
      'Vĩ độ phải lớn hơn hoặc bằng -90.',
  })
  @Max(90, {
    message:
      'Vĩ độ phải nhỏ hơn hoặc bằng 90.',
  })
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 6,
    },
    {
      message:
        'Kinh độ phải là một số.',
    },
  )
  @Min(-180, {
    message:
      'Kinh độ phải lớn hơn hoặc bằng -180.',
  })
  @Max(180, {
    message:
      'Kinh độ phải nhỏ hơn hoặc bằng 180.',
  })
  longitude?: number;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message:
      'Meta title không được vượt quá 255 ký tự.',
  })
  metaTitle?: string;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message:
      'Meta description không được vượt quá 500 ký tự.',
  })
  metaDescription?: string;
}