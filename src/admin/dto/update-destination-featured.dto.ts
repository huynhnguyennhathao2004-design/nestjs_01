import {
  IsBoolean,
} from 'class-validator';

export class UpdateDestinationFeaturedDto {
  @IsBoolean({
    message:
      'isFeatured phải là true hoặc false.',
  })
  isFeatured!: boolean;
}