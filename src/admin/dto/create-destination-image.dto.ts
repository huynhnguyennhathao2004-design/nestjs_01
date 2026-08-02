import {
  Transform,
  Type,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import {
  DestinationImageType,
} from '../../generated/prisma/enums';

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

export class CreateDestinationImageDto {
  @Transform(trimRequiredString)
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
  url!: string;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Storage key phải là chuỗi.',
  })
  @MaxLength(1000)
  storageKey?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Mô tả ảnh phải là chuỗi.',
  })
  @MaxLength(500)
  altText?: string | null;

  @IsOptional()
  @IsEnum(DestinationImageType, {
    message:
      'Loại ảnh chỉ chấp nhận COVER hoặc GALLERY.',
  })
  imageType:
    DestinationImageType =
      DestinationImageType.GALLERY;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'URL nguồn ảnh phải là chuỗi.',
  })
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

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      'Thứ tự ảnh phải là số nguyên.',
  })
  @Min(0, {
    message:
      'Thứ tự ảnh phải lớn hơn hoặc bằng 0.',
  })
  sortOrder: number = 0;

  @IsOptional()
  @IsBoolean({
    message:
      'isActive phải là true hoặc false.',
  })
  isActive: boolean = true;
}