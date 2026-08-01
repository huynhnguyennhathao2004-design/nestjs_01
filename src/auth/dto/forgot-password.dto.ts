import {
  IsEmail,
  MaxLength,
} from 'class-validator';

export class ForgotPasswordDto {
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
}