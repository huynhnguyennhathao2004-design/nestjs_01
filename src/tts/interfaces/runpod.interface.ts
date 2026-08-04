export type RunpodJobStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT'
  | string;

export type PublicTtsJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'unknown';

/**
 * Phản hồi sau khi NestJS gửi yêu cầu tạo job lên RunPod.
 */
export interface RunpodSubmitResponse {
  id: string;
  status?: RunpodJobStatus;
}

/**
 * Lỗi do handler Python trả về.
 *
 * Ví dụ:
 * {
 *   "type": "RuntimeError",
 *   "message": "Không thể upload file..."
 * }
 */
export interface RunpodWorkerError {
  type?: string;
  message?: string;
}

/**
 * Thông tin file âm thanh trong output của worker.
 *
 * Hỗ trợ đồng thời:
 * - Job cũ trả Base64.
 * - Job mới trả URL object storage.
 */
export interface RunpodAudioResult {
  /*
   * Snake case từ worker mới.
   */
  filename?: string;
  mime_type?: string;
  size_bytes?: number;

  /*
   * Camel case từ một số worker cũ.
   */
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;

  sample_rate?: number;
  trailing_silence_ms?: number;
  /**
   * Dữ liệu của job cũ.
   */
  base64?: string;

  /**
   * Dữ liệu của job mới dùng object storage.
   */
  url?: string;
  audioUrl?: string;

  storage_key?: string;
  storageKey?: string;

  expires_in?: number;
}

/**
 * Thông tin văn bản và các tham số đầu vào.
 */
export interface RunpodInputResult {
  original_text_characters?: number;
  normalized_text_characters?: number;
  speed?: number;
  nfe_step?: number;
}

/**
 * Thông tin thời gian xử lý.
 */
export interface RunpodTimingResult {
  worker_model_ready_seconds?: number;
  inference_seconds?: number;
  request_total_seconds?: number;
}

/**
 * Thông tin worker thực thi job.
 */
export interface RunpodWorkerResult {
  gpu?: string;
  model?: string;
  repository?: string;
}

/**
 * Output do handler.py trả về.
 */
export interface RunpodWorkerOutput {
  success?: boolean;

  /**
   * Handler mới trả URL ở cấp ngoài:
   *
   * {
   *   "audioUrl": "https://..."
   * }
   */
  audioUrl?: string;
    /*
   * Hỗ trợ output từ worker cũ.
   */
  audio_url?: string;
  storage_key?: string;
  storageKey?: string;

  /**
   * Đồng thời handler cũng có thể trả:
   *
   * {
   *   "audio": {
   *     "url": "https://..."
   *   }
   * }
   */
  audio?: RunpodAudioResult;

  input?: RunpodInputResult;
  timing?: RunpodTimingResult;
  worker?: RunpodWorkerResult;

  /**
   * Handler mới trả error dạng object.
   * Một số phiên bản cũ có thể trả dạng string.
   */
  error?: string | RunpodWorkerError;

  message?: string;
}

/**
 * Phản hồi khi kiểm tra trạng thái job từ RunPod.
 */
export interface RunpodStatusResponse {
  id?: string;
  status: RunpodJobStatus;
  delayTime?: number;
  executionTime?: number;

  /**
   * Lỗi cấp RunPod, thường là chuỗi.
   * Để an toàn vẫn hỗ trợ object.
   */
  error?: string | RunpodWorkerError;

  output?: RunpodWorkerOutput;
}

/**
 * Dữ liệu âm thanh mà service NestJS trả cho controller.
 */
export interface TtsAudioFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}