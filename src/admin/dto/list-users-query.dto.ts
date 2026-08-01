import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Trang phải là số nguyên',
  })
  @Min(1, {
    message: 'Trang phải lớn hơn hoặc bằng 1',
  })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Giới hạn phải là số nguyên',
  })
  @Min(1, {
    message: 'Giới hạn phải lớn hơn hoặc bằng 1',
  })
  @Max(100, {
    message: 'Mỗi trang chỉ được tối đa 100 tài khoản',
  })
  limit: number = 20;

  @IsOptional()
  @IsString({
    message: 'Từ khóa tìm kiếm phải là chuỗi',
  })
  @MaxLength(120, {
    message: 'Từ khóa tìm kiếm quá dài',
  })
  search?: string;
}