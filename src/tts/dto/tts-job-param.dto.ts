import { IsString, Matches, MaxLength } from 'class-validator';

export class TtsJobParamDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Job ID không hợp lệ.',
  })
  jobId!: string;
}