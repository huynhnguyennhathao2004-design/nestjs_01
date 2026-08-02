import {
  Transform,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimRequiredString(
  params: TransformFnParams,
): unknown {
  if (typeof params.value !== 'string') {
    return params.value;
  }

  return params.value.trim();
}

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

function toOptionalInteger(
  params: TransformFnParams,
): unknown {
  if (
    params.value === undefined ||
    params.value === null ||
    params.value === ''
  ) {
    return undefined;
  }

  return Number(params.value);
}

export class CreateDestinationFoodDto {
  @Transform(trimRequiredString)
  @IsString({
    message: 'Tên món ăn phải là chuỗi.',
  })
  @MinLength(2, {
    message:
      'Tên món ăn phải có ít nhất 2 ký tự.',
  })
  @MaxLength(180, {
    message:
      'Tên món ăn không được vượt quá 180 ký tự.',
  })
  name!: string;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Mô tả món ăn phải là chuỗi.',
  })
  @MaxLength(5000, {
    message:
      'Mô tả món ăn không được vượt quá 5000 ký tự.',
  })
  description?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Đường dẫn ảnh phải là chuỗi.',
  })
  @Matches(
    /^(https?:\/\/|\/)/i,
    {
      message:
        'Đường dẫn ảnh phải bắt đầu bằng /, http:// hoặc https://.',
    },
  )
  @MaxLength(2000, {
    message:
      'Đường dẫn ảnh quá dài.',
  })
  imageUrl?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Mô tả ảnh phải là chuỗi.',
  })
  @MaxLength(500)
  imageAlt?: string | null;

  @Transform(toOptionalInteger)
  @IsOptional()
  @IsInt({
    message:
      'Giá thấp nhất phải là số nguyên.',
  })
  @Min(0, {
    message:
      'Giá thấp nhất phải lớn hơn hoặc bằng 0.',
  })
  @Max(2_147_483_647, {
    message:
      'Giá thấp nhất vượt quá giới hạn cho phép.',
  })
  priceMin?: number;

  @Transform(toOptionalInteger)
  @IsOptional()
  @IsInt({
    message:
      'Giá cao nhất phải là số nguyên.',
  })
  @Min(0, {
    message:
      'Giá cao nhất phải lớn hơn hoặc bằng 0.',
  })
  @Max(2_147_483_647, {
    message:
      'Giá cao nhất vượt quá giới hạn cho phép.',
  })
  priceMax?: number;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Ghi chú giá phải là chuỗi.',
  })
  @MaxLength(255, {
    message:
      'Ghi chú giá không được vượt quá 255 ký tự.',
  })
  priceNote?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Khu vực gợi ý phải là chuỗi.',
  })
  @MaxLength(255, {
    message:
      'Khu vực gợi ý không được vượt quá 255 ký tự.',
  })
  suggestedArea?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'URL nguồn ảnh phải là chuỗi.',
  })
  @Matches(
    /^https?:\/\//i,
    {
      message:
        'URL nguồn ảnh phải bắt đầu bằng http:// hoặc https://.',
    },
  )
  @MaxLength(2000)
  sourceUrl?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Thông tin bản quyền ảnh phải là chuỗi.',
  })
  @MaxLength(500)
  imageCredit?: string | null;

  @Transform(toOptionalInteger)
  @IsOptional()
  @IsInt({
    message:
      'Thứ tự món ăn phải là số nguyên.',
  })
  @Min(0, {
    message:
      'Thứ tự món ăn phải lớn hơn hoặc bằng 0.',
  })
  sortOrder: number = 0;

  @IsOptional()
  @IsBoolean({
    message:
      'isActive phải là true hoặc false.',
  })
  isActive: boolean = true;
}