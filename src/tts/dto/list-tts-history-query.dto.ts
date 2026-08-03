import {
  Transform,
  Type,
} from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  TtsJobStatus,
} from '../../generated/prisma/enums';

import {
  TtsVoice,
} from './create-tts-job.dto';

export class ListTtsHistoryQueryDto {
  /**
   * Trang hiện tại.
   *
   * Ví dụ:
   * GET /api/tts/history?page=1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      'page phải là số nguyên.',
  })
  @Min(1, {
    message:
      'page phải lớn hơn hoặc bằng 1.',
  })
  page: number = 1;

  /**
   * Số bản ghi mỗi trang.
   *
   * Giới hạn tối đa 50 để tránh
   * truy vấn quá nhiều dữ liệu.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      'limit phải là số nguyên.',
  })
  @Min(1, {
    message:
      'limit phải lớn hơn hoặc bằng 1.',
  })
  @Max(50, {
    message:
      'limit không được vượt quá 50.',
  })
  limit: number = 10;

  /**
   * Lọc theo trạng thái TTS.
   *
   * Chấp nhận cả:
   * completed
   * COMPLETED
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (
      typeof value !== 'string'
    ) {
      return value;
    }

    const normalizedValue =
      value
        .trim()
        .toUpperCase();

    return normalizedValue ||
      undefined;
  })
  @IsEnum(TtsJobStatus, {
    message:
      'status không hợp lệ.',
  })
  status?: TtsJobStatus;

  /**
   * Lọc theo giọng đọc.
   *
   * male hoặc female.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (
      typeof value !== 'string'
    ) {
      return value;
    }

    const normalizedValue =
      value
        .trim()
        .toLowerCase();

    return normalizedValue ||
      undefined;
  })
  @IsEnum(TtsVoice, {
    message:
      'voice chỉ được phép là male hoặc female.',
  })
  voice?: TtsVoice;

  /**
   * Tìm kiếm trong nội dung gốc.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (
      typeof value !== 'string'
    ) {
      return value;
    }

    const normalizedValue =
      value
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim();

    return normalizedValue ||
      undefined;
  })
  @IsString({
    message:
      'q phải là chuỗi văn bản.',
  })
  @MaxLength(200, {
    message:
      'Từ khóa tìm kiếm không được vượt quá 200 ký tự.',
  })
  q?: string;
}