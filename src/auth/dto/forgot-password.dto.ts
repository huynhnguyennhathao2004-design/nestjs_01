import {
  IsEmail,
  MaxLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail(
    {
      require_tld: false,
      allow_ip_domain: true,
    },
    {
      message: 'Email không hợp lệ',
    },
  )
  @MaxLength(320, {
    message: 'Email quá dài',
  })
  email!: string;
}