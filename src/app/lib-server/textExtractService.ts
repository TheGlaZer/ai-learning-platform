/**
 * Re-export text extraction functionality from the file processing utilities
 * This service acts as a bridge between server-side components and the utility functions
 */

import { extractTextFromFile as extractTextUtil } from "@/app/utils/fileProcessing/index";
import { FileTypeProcessorOptions } from "@/app/utils/fileProcessing/types";

/**
 * Extract text content from a file
 * @param fileBuffer The file buffer to extract content from
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file (for extension-based fallback)
 * @param options Additional options for processing
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromFile(
  fileBuffer: ArrayBuffer, 
  mimeType: string, 
  fileName: string,
  options: FileTypeProcessorOptions = {}
): Promise<string> {
  return extractTextUtil(fileBuffer, mimeType, fileName, options);
} 