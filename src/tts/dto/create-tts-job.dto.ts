import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTtsJobDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim();
  })
  @IsString({ message: 'Nội dung phải là chuỗi văn bản.' })
  @MinLength(1, { message: 'Nội dung không được để trống.' })
  @MaxLength(5000, {
    message: 'Nội dung không được vượt quá 5000 ký tự.',
  })
  text!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 2,
    },
    {
      message: 'Tốc độ đọc phải là một số hợp lệ.',
    },
  )
  @Min(0.5, {
    message: 'Tốc độ đọc tối thiểu là 0.5.',
  })
  @Max(2, {
    message: 'Tốc độ đọc tối đa là 2.0.',
  })
  speed: number = 1.0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'nfeStep phải là số nguyên.',
  })
  @Min(8, {
    message: 'nfeStep tối thiểu là 8.',
  })
  @Max(64, {
    message: 'nfeStep tối đa là 64.',
  })
  nfeStep: number = 32;
}