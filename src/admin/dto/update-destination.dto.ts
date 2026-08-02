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

function trimOptionalString(
  params: TransformFnParams,
): unknown {
  if (typeof params.value !== 'string') {
    return params.value;
  }

  return params.value.trim();
}

/**
 * Cho phép:
 * - Không gửi trường: giữ dữ liệu cũ.
 * - Gửi null hoặc chuỗi rỗng: xóa dữ liệu cũ.
 * - Gửi chuỗi: cắt khoảng trắng.
 */
function trimNullableString(
  params: TransformFnParams,
): unknown {
  if (params.value === null) {
    return null;
  }

  if (typeof params.value !== 'string') {
    return params.value;
  }

  const normalizedValue = params.value.trim();

  return normalizedValue || null;
}

export class UpdateDestinationDto {
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString({
    message: 'Tên địa điểm phải là chuỗi.',
  })
  @MinLength(2, {
    message: 'Tên địa điểm phải có ít nhất 2 ký tự.',
  })
  @MaxLength(180, {
    message: 'Tên địa điểm không được vượt quá 180 ký tự.',
  })
  name?: string;

  /**
   * Slug chỉ thay đổi khi Admin gửi trường này.
   * Đổi tên không tự động làm thay đổi slug.
   */
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString({
    message: 'Slug phải là chuỗi.',
  })
  @MinLength(1, {
    message: 'Slug không được để trống.',
  })
  @MaxLength(180, {
    message: 'Slug không được vượt quá 180 ký tự.',
  })
  slug?: string;

  @IsOptional()
  @IsUUID('4', {
    message: 'ID tỉnh/thành không hợp lệ.',
  })
  provinceId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: 'ID danh mục chính không hợp lệ.',
  })
  primaryCategoryId?: string;

  /**
   * Khi gửi categoryIds, danh sách liên kết cũ
   * sẽ được thay thế bằng danh sách mới.
   *
   * Danh mục chính luôn được backend tự thêm vào.
   */
  @IsOptional()
  @IsArray({
    message: 'Danh sách danh mục phải là một mảng.',
  })
  @ArrayUnique({
    message: 'Danh sách danh mục không được chứa ID trùng.',
  })
  @IsUUID('4', {
    each: true,
    message: 'Danh sách có ID danh mục không hợp lệ.',
  })
  categoryIds?: string[];

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message: 'Mô tả ngắn phải là chuỗi.',
  })
  @MaxLength(500, {
    message: 'Mô tả ngắn không được vượt quá 500 ký tự.',
  })
  shortDescription?: string | null;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString({
    message: 'Nội dung giới thiệu phải là chuỗi.',
  })
  @MinLength(10, {
    message: 'Nội dung giới thiệu phải có ít nhất 10 ký tự.',
  })
  description?: string;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message: 'Thời điểm du lịch phải là chuỗi.',
  })
  @MaxLength(255, {
    message: 'Thời điểm du lịch không được vượt quá 255 ký tự.',
  })
  bestTravelTime?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message: 'Thông tin bản đồ phải là chuỗi.',
  })
  @MaxLength(1000, {
    message: 'Thông tin bản đồ quá dài.',
  })
  mapQuery?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 6,
    },
    {
      message: 'Vĩ độ phải là một số.',
    },
  )
  @Min(-90, {
    message: 'Vĩ độ phải lớn hơn hoặc bằng -90.',
  })
  @Max(90, {
    message: 'Vĩ độ phải nhỏ hơn hoặc bằng 90.',
  })
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 6,
    },
    {
      message: 'Kinh độ phải là một số.',
    },
  )
  @Min(-180, {
    message: 'Kinh độ phải lớn hơn hoặc bằng -180.',
  })
  @Max(180, {
    message: 'Kinh độ phải nhỏ hơn hoặc bằng 180.',
  })
  longitude?: number | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message: 'Meta title phải là chuỗi.',
  })
  @MaxLength(255, {
    message: 'Meta title không được vượt quá 255 ký tự.',
  })
  metaTitle?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message: 'Meta description phải là chuỗi.',
  })
  @MaxLength(500, {
    message: 'Meta description không được vượt quá 500 ký tự.',
  })
  metaDescription?: string | null;
}