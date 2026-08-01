import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsString({
    message: 'Mật khẩu hiện tại phải là chuỗi',
  })
  @IsNotEmpty({
    message: 'Vui lòng nhập mật khẩu hiện tại',
  })
  @MaxLength(128, {
    message:
      'Mật khẩu hiện tại không được vượt quá 128 ký tự',
  })
  currentPassword!: string;

  @IsString({
    message: 'Mật khẩu mới phải là chuỗi',
  })
  @IsNotEmpty({
    message: 'Vui lòng nhập mật khẩu mới',
  })
  @MinLength(8, {
    message:
      'Mật khẩu mới phải có ít nhất 8 ký tự',
  })
  @MaxLength(128, {
    message:
      'Mật khẩu mới không được vượt quá 128 ký tự',
  })
  newPassword!: string;

  @IsString({
    message:
      'Mật khẩu xác nhận phải là chuỗi',
  })
  @IsNotEmpty({
    message:
      'Vui lòng xác nhận mật khẩu mới',
  })
  @MinLength(8, {
    message:
      'Mật khẩu xác nhận phải có ít nhất 8 ký tự',
  })
  @MaxLength(128, {
    message:
      'Mật khẩu xác nhận không được vượt quá 128 ký tự',
  })
  confirmNewPassword!: string;
}