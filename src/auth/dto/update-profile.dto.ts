import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString({
    message: 'Họ và tên phải là chuỗi',
  })
  @IsNotEmpty({
    message: 'Vui lòng nhập họ và tên',
  })
  @MinLength(2, {
    message: 'Họ và tên phải có ít nhất 2 ký tự',
  })
  @MaxLength(120, {
    message: 'Họ và tên không được vượt quá 120 ký tự',
  })
  fullName!: string;
}