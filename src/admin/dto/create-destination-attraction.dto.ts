import {
  Transform,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsBoolean,
  IsInt,
  IsNumber,
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

  const normalizedValue =
    params.value.trim();

  return normalizedValue || null;
}

function toOptionalNumber(
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

export class CreateDestinationAttractionDto {
  @Transform(trimRequiredString)
  @IsString({
    message:
      'Tên điểm khám phá phải là chuỗi.',
  })
  @MinLength(2, {
    message:
      'Tên điểm khám phá phải có ít nhất 2 ký tự.',
  })
  @MaxLength(180, {
    message:
      'Tên điểm khám phá không được vượt quá 180 ký tự.',
  })
  name!: string;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Mô tả điểm khám phá phải là chuỗi.',
  })
  @MaxLength(5000, {
    message:
      'Mô tả điểm khám phá không được vượt quá 5000 ký tự.',
  })
  description?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Địa chỉ phải là chuỗi.',
  })
  @MaxLength(500, {
    message:
      'Địa chỉ không được vượt quá 500 ký tự.',
  })
  address?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Thông tin tìm kiếm bản đồ phải là chuỗi.',
  })
  @MaxLength(1000, {
    message:
      'Thông tin tìm kiếm bản đồ quá dài.',
  })
  mapQuery?: string | null;

  @Transform(toOptionalNumber)
  @IsOptional()
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

  @Transform(toOptionalNumber)
  @IsOptional()
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

  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt({
    message:
      'Thứ tự điểm khám phá phải là số nguyên.',
  })
  @Min(0, {
    message:
      'Thứ tự điểm khám phá phải lớn hơn hoặc bằng 0.',
  })
  sortOrder: number = 0;

  @IsOptional()
  @IsBoolean({
    message:
      'isActive phải là true hoặc false.',
  })
  isActive: boolean = true;
}