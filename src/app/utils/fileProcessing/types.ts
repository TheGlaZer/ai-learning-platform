export interface FileTypeProcessorOptions {
  language?: string; // 'en', 'he', etc.
  extractFormatting?: boolean;
  maxPages?: number;
  timeout?: number;
  addPageMarkers?: boolean; // Whether to include page markers in the output
}

export type FileTypeProcessor = (
  fileBuffer: ArrayBuffer,
  options?: FileTypeProcessorOptions
) => Promise<string>;

export interface FileTypeProcessorMap {
  [mimeType: string]: FileTypeProcessor;
} 