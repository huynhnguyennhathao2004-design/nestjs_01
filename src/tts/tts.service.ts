import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';

type TtsVoice =
  | 'alloy'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'echo'
  | 'fable'
  | 'nova'
  | 'onyx'
  | 'sage'
  | 'shimmer';

@Injectable()
export class TtsService {
  private readonly openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'Thiếu OPENAI_API_KEY trong file .env',
      );
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSpeech(text: string, voice: TtsVoice = 'alloy'): Promise<Buffer> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Vui lòng nhập nội dung văn bản');
    }

    if (text.length > 4000) {
      throw new BadRequestException(
        'Văn bản quá dài. Vui lòng nhập dưới 4000 ký tự.',
      );
    }

    try {
      const cleanText = this.normalizeTravelText(text);

      const response = await this.openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: voice,
        input: cleanText,
        response_format: 'mp3',
      });

      const arrayBuffer = await response.arrayBuffer();

      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error('Lỗi tạo âm thanh chi tiết:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type,
      });

      throw new InternalServerErrorException(
        error?.message ||
          'Không thể tạo âm thanh. Vui lòng kiểm tra API key hoặc thử lại sau.',
      );
    }
  }

  private normalizeTravelText(text: string): string {
    return `
Bạn đang đọc một đoạn thuyết minh du lịch Việt Nam.
Hãy đọc bằng giọng tự nhiên, rõ ràng, truyền cảm, phù hợp để giới thiệu địa điểm du lịch.

Nội dung:
${text.trim()}
    `;
  }
}
