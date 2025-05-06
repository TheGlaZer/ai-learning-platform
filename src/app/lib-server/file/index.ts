'use server';

import { 
  getFileContent as _getFileContent,
  getMimeTypeFromExtension as _getMimeTypeFromExtension,
  extractFilePathFromUrl as _extractFilePathFromUrl
} from './fileContentHelper';

// Re-export with proper async wrappers
export async function getFileContent(...args: Parameters<typeof _getFileContent>) {
  return _getFileContent(...args);
}

export function getMimeTypeFromExtension(...args: Parameters<typeof _getMimeTypeFromExtension>) {
  return _getMimeTypeFromExtension(...args);
}

export function extractFilePathFromUrl(...args: Parameters<typeof _extractFilePathFromUrl>) {
  return _extractFilePathFromUrl(...args);
} 