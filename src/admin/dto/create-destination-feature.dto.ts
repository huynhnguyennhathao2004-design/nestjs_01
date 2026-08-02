import {
  Transform,
  Type,
  type TransformFnParams,
} from 'class-transformer';

import {
  IsInt,
  IsOptional,
  IsString,
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

export class CreateDestinationFeatureDto {
  @Transform(trimRequiredString)
  @IsString({
    message:
      'Tiêu đề đặc điểm phải là chuỗi.',
  })
  @MinLength(2, {
    message:
      'Tiêu đề đặc điểm phải có ít nhất 2 ký tự.',
  })
  @MaxLength(180, {
    message:
      'Tiêu đề đặc điểm không được vượt quá 180 ký tự.',
  })
  title!: string;

  @Transform(trimRequiredString)
  @IsString({
    message:
      'Nội dung đặc điểm phải là chuỗi.',
  })
  @MinLength(2, {
    message:
      'Nội dung đặc điểm phải có ít nhất 2 ký tự.',
  })
  @MaxLength(5000, {
    message:
      'Nội dung đặc điểm không được vượt quá 5000 ký tự.',
  })
  content!: string;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString({
    message:
      'Biểu tượng phải là chuỗi.',
  })
  @MaxLength(120, {
    message:
      'Tên biểu tượng không được vượt quá 120 ký tự.',
  })
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      'Thứ tự đặc điểm phải là số nguyên.',
  })
  @Min(0, {
    message:
      'Thứ tự đặc điểm phải lớn hơn hoặc bằng 0.',
  })
  sortOrder: number = 0;
}