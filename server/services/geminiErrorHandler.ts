export type GeminiErrorCategory =
  | 'missing_key'
  | 'billing_disabled'
  | 'permission_denied'
  | 'invalid_key'
  | 'model_not_found'
  | 'rate_limited'
  | 'transient'
  | 'unknown';

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory;
  statusCode: number | null;
  isPermanentForKey: boolean;
  shouldRetry: boolean;
  userNotice: string;
}

interface KeyCircuitEntry {
  category: GeminiErrorCategory;
  notice: string;
  blockedUntilMs: number;
}

const KEY_CIRCUIT_COOLDOWN_MS = 10 * 60 * 1000;
const keyCircuitMap = new Map<string, KeyCircuitEntry>();

function extractErrorText(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return '';
}

function extractStatusCode(err: unknown, rawText: string): number | null {
  if (err && typeof err === 'object') {
    const maybeStatus = (err as { status?: unknown }).status;
    if (typeof maybeStatus === 'number' && Number.isInteger(maybeStatus)) {
      return maybeStatus;
    }
    const maybeCode = (err as { code?: unknown }).code;
    if (typeof maybeCode === 'number' && Number.isInteger(maybeCode)) {
      return maybeCode;
    }
  }
  const codeMatch = rawText.match(/"code"\s*:\s*(\d{3})/);
  if (codeMatch) {
    const parsed = Number(codeMatch[1]);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
}

export function formatGeminiNotice(category: GeminiErrorCategory): string {
  switch (category) {
    case 'missing_key':
      return 'Gemini API key is not configured in Settings > Secrets — using EDVANTA curated physics content.';
    case 'billing_disabled':
      return 'Live Gemini AI generation requires a billing-enabled API key in Settings > Secrets — using curated physics content.';
    case 'permission_denied':
    case 'invalid_key':
      return 'Please check your Gemini API key in Settings > Secrets — using curated physics content in the meantime.';
    case 'model_not_found':
      return 'Configured Gemini model is unavailable — using curated physics content.';
    case 'rate_limited':
      return 'Gemini AI rate limit reached — using curated physics content for now.';
    case 'transient':
    case 'unknown':
    default:
      return 'Gemini AI is temporarily unavailable — using curated physics content.';
  }
}

export function classifyGeminiError(err: unknown): ClassifiedGeminiError {
  const rawText = extractErrorText(err);
  const lower = rawText.toLowerCase();
  const statusCode = extractStatusCode(err, rawText);

  if (
    statusCode === 403 ||
    lower.includes('permission_denied') ||
    lower.includes('free tier is not available')
  ) {
    const isBilling =
      lower.includes('billing') ||
      lower.includes('free tier') ||
      lower.includes('paid tier') ||
      lower.includes('project-unavailable');
    const category: GeminiErrorCategory = isBilling ? 'billing_disabled' : 'permission_denied';
    return {
      category,
      statusCode: statusCode ?? 403,
      isPermanentForKey: true,
      shouldRetry: false,
      userNotice: formatGeminiNotice(category),
    };
  }

  if (
    statusCode === 400 &&
    (lower.includes('api_key_invalid') || lower.includes('api key not valid'))
  ) {
    return {
      category: 'invalid_key',
      statusCode: 400,
      isPermanentForKey: true,
      shouldRetry: false,
      userNotice: formatGeminiNotice('invalid_key'),
    };
  }

  if (statusCode === 404 || lower.includes('not_found')) {
    return {
      category: 'model_not_found',
      statusCode: statusCode ?? 404,
      isPermanentForKey: true,
      shouldRetry: false,
      userNotice: formatGeminiNotice('model_not_found'),
    };
  }

  if (statusCode === 429 || lower.includes('resource_exhausted')) {
    return {
      category: 'rate_limited',
      statusCode: statusCode ?? 429,
      isPermanentForKey: false,
      shouldRetry: true,
      userNotice: formatGeminiNotice('rate_limited'),
    };
  }

  if (
    (statusCode !== null && statusCode >= 500) ||
    lower.includes('timeout') ||
    lower.includes('econnreset') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    return {
      category: 'transient',
      statusCode,
      isPermanentForKey: false,
      shouldRetry: true,
      userNotice: formatGeminiNotice('transient'),
    };
  }

  return {
    category: 'unknown',
    statusCode,
    isPermanentForKey: false,
    shouldRetry: false,
    userNotice: formatGeminiNotice('unknown'),
  };
}

export function getGeminiCircuitState(apiKey: string, nowMs: number = Date.now()): KeyCircuitEntry | null {
  const entry = keyCircuitMap.get(apiKey);
  if (!entry) return null;
  if (nowMs >= entry.blockedUntilMs) {
    keyCircuitMap.delete(apiKey);
    return null;
  }
  return entry;
}

export function recordGeminiFailure(
  apiKey: string,
  err: unknown,
  nowMs: number = Date.now()
): ClassifiedGeminiError {
  const classified = classifyGeminiError(err);
  if (classified.isPermanentForKey) {
    keyCircuitMap.set(apiKey, {
      category: classified.category,
      notice: classified.userNotice,
      blockedUntilMs: nowMs + KEY_CIRCUIT_COOLDOWN_MS,
    });
  }
  return classified;
}

export function resetGeminiCircuitForTest(): void {
  keyCircuitMap.clear();
}

export async function runWithGeminiRetry<T>(
  operation: () => Promise<T>,
  options?: { maxRetries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 1;
  const baseDelayMs = options?.baseDelayMs ?? 300;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const classified = classifyGeminiError(err);
      if (!classified.shouldRetry || attempt >= maxRetries) {
        throw err;
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
