export interface FileTypeProcessorOptions {
  language?: string; // 'en', 'he', etc.
  extractFormatting?: boolean;
  maxPages?: number;
  timeout?: number;
}

export type FileTypeProcessor = (
  fileBuffer: ArrayBuffer,
  options?: FileTypeProcessorOptions
) => Promise<string>;

export interface FileTypeProcessorMap {
  [mimeType: string]: FileTypeProcessor;
} 