import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
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
  @MinLength(1, {
    message: 'Vui lòng nhập mật khẩu',
  })
  @MaxLength(128, {
    message: 'Mật khẩu quá dài',
  })
  password!: string;
}