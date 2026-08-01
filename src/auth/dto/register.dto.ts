import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
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

  @IsEmail(
    {},
    {
      message: 'Email không hợp lệ',
    },
  )
  @MaxLength(320, {
    message: 'Email quá dài',
  })
  email!: string;

  @IsString({
    message: 'Mật khẩu phải là chuỗi',
  })
  @MinLength(8, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự',
  })
  @MaxLength(128, {
    message: 'Mật khẩu không được vượt quá 128 ký tự',
  })
  password!: string;
}