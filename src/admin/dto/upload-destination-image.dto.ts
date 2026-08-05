import {
  Transform,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  DestinationImageType,
} from '../../generated/prisma/enums';

function transformOptionalText(
  parameters: TransformFnParams,
): string | undefined {
  if (
    parameters.value === undefined ||
    parameters.value === null
  ) {
    return undefined;
  }

  const value =
    String(
      parameters.value,
    ).trim();

  return value ||
    undefined;
}

function transformOptionalInteger(
  parameters: TransformFnParams,
): number | undefined {
  if (
    parameters.value === undefined ||
    parameters.value === null ||
    parameters.value === ''
  ) {
    return undefined;
  }

  return Number(
    parameters.value,
  );
}

function transformOptionalBoolean(
  parameters: TransformFnParams,
): boolean | unknown {
  const value =
    parameters.value;

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined;
  }

  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  const normalizedValue =
    String(
      value,
    )
      .trim()
      .toLowerCase();

  if (
    normalizedValue === 'true' ||
    normalizedValue === '1' ||
    normalizedValue === 'on'
  ) {
    return true;
  }

  if (
    normalizedValue === 'false' ||
    normalizedValue === '0' ||
    normalizedValue === 'off'
  ) {
    return false;
  }

  return value;
}

export class UploadDestinationImageDto {
  @IsOptional()
  @IsEnum(
    DestinationImageType,
    {
      message:
        'Loại ảnh phải là COVER, GALLERY hoặc THUMBNAIL.',
    },
  )
  imageType?:
    DestinationImageType;

  @IsOptional()
  @Transform(
    transformOptionalText,
  )
  @IsString()
  @MaxLength(
    255,
    {
      message:
        'Mô tả ảnh không được vượt quá 255 ký tự.',
    },
  )
  altText?:
    string;

  @IsOptional()
  @Transform(
    transformOptionalText,
  )
  @IsUrl(
    {
      require_protocol:
        true,
    },
    {
      message:
        'URL nguồn ảnh không hợp lệ.',
    },
  )
  sourceUrl?:
    string;

  @IsOptional()
  @Transform(
    transformOptionalText,
  )
  @IsString()
  @MaxLength(
    255,
    {
      message:
        'Thông tin tác giả ảnh không được vượt quá 255 ký tự.',
    },
  )
  imageCredit?:
    string;

  @IsOptional()
  @Transform(
    transformOptionalInteger,
  )
  @IsInt({
    message:
      'Thứ tự ảnh phải là số nguyên.',
  })
  @Min(
    0,
    {
      message:
        'Thứ tự ảnh không được nhỏ hơn 0.',
    },
  )
  @Max(
    10_000,
    {
      message:
        'Thứ tự ảnh không được vượt quá 10000.',
    },
  )
  sortOrder?:
    number;

  @IsOptional()
  @Transform(
    transformOptionalBoolean,
  )
  @IsBoolean({
    message:
      'Trạng thái hoạt động của ảnh không hợp lệ.',
  })
  isActive?:
    boolean;
}