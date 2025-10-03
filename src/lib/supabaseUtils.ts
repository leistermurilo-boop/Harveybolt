import { PostgrestError } from '@supabase/supabase-js';

type StorageError = {
  name: string;
  message: string;
  statusCode?: string;
};

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
        error: lastError.message,
      });

      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const err = error as PostgrestError | StorageError | Error;

  if ('code' in err) {
    const retryableCodes = ['PGRST301', '500', '502', '503', '504', '408'];
    return retryableCodes.includes(String(err.code));
  }

  if (err.message) {
    const retryableMessages = [
      'fetch failed',
      'network',
      'timeout',
      'ECONNRESET',
      'ETIMEDOUT',
    ];
    return retryableMessages.some((msg) =>
      err.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SupabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(
  error: PostgrestError | StorageError | Error | null,
  operation: string
): never {
  if (!error) {
    throw new SupabaseError(`Unknown error during ${operation}`);
  }

  if ('code' in error && 'message' in error) {
    throw new SupabaseError(
      `${operation} failed: ${error.message}`,
      String(error.code),
      error
    );
  }

  throw new SupabaseError(
    `${operation} failed: ${error.message}`,
    undefined,
    error
  );
}

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const {
    maxSizeMB = 50,
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions = ['pdf', 'doc', 'docx'],
  } = options;

  if (file.size === 0) {
    return { valid: false, error: 'Arquivo está vazio' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedExtensions.join(', ')}`,
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Extensão não permitida. Extensões aceitas: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

export function sanitizeFileName(fileName: string): string {
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));

  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);

  return `${sanitized}.${extension}`;
}

export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = sanitizeFileName(originalName);
  const baseName = sanitized.slice(0, sanitized.lastIndexOf('.'));

  return prefix
    ? `${prefix}/${timestamp}-${random}-${baseName}.${extension}`
    : `${timestamp}-${random}-${baseName}.${extension}`;
}
