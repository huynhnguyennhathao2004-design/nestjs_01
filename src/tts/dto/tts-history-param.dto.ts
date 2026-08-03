import {
  IsUUID,
} from 'class-validator';

export class TtsHistoryParamDto {
  @IsUUID('4', {
    message:
      'ttsJobId phải là UUID hợp lệ.',
  })
  ttsJobId!: string;
}