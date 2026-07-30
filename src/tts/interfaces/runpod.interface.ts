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

export interface RunpodSubmitResponse {
  id: string;
  status?: RunpodJobStatus;
}

export interface RunpodAudioResult {
  base64?: string;
  filename?: string;
  mime_type?: string;
  sample_rate?: number;
  size_bytes?: number;
}

export interface RunpodTimingResult {
  worker_model_ready_seconds?: number;
  inference_seconds?: number;
  request_total_seconds?: number;
}

export interface RunpodWorkerResult {
  gpu?: string;
}

export interface RunpodWorkerOutput {
  success?: boolean;
  error?: string;
  message?: string;
  audio?: RunpodAudioResult;
  timing?: RunpodTimingResult;
  worker?: RunpodWorkerResult;
}

export interface RunpodStatusResponse {
  id?: string;
  status: RunpodJobStatus;
  delayTime?: number;
  executionTime?: number;
  error?: string;
  output?: RunpodWorkerOutput;
}

export interface TtsAudioFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}