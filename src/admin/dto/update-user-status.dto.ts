import {
  IsIn,
  IsString,
} from 'class-validator';

export class UpdateUserStatusDto {
  @IsString({
    message:
      'Trạng thái tài khoản phải là chuỗi',
  })
  @IsIn(
    [
      'ACTIVE',
      'LOCKED',
    ],
    {
      message:
        'Trạng thái chỉ được là ACTIVE hoặc LOCKED',
    },
  )
  status!: 'ACTIVE' | 'LOCKED';
}