
export type PromptType = 'SORA_2' | 'VEO_3_JSON' | 'VIDEO_ANALYSIS' | 'STORYBOARD' | 'UGC_CONTENT' | 'VOICE_OVER';

export interface FileAttachment {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  base64: string;
}

export interface GenerationResult {
  text: string;
  type: PromptType;
}
