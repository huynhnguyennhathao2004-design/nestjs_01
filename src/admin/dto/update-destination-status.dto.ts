import {
  IsEnum,
} from 'class-validator';

import {
  DestinationStatus,
} from '../../generated/prisma/enums';

export class UpdateDestinationStatusDto {
  @IsEnum(DestinationStatus, {
    message:
      'Trạng thái địa điểm không hợp lệ. ' +
      'Giá trị cho phép: DRAFT, PUBLISHED, HIDDEN, ARCHIVED.',
  })
  status!: DestinationStatus;
}