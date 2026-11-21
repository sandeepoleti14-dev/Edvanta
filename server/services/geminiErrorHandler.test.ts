import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyGeminiError,
  getGeminiCircuitState,
  recordGeminiFailure,
  resetGeminiCircuitForTest,
  runWithGeminiRetry,
} from './geminiErrorHandler';

test('classifies billing-restricted 403 PERMISSION_DENIED errors as permanent for key without retry', () => {
  const rawError = new Error(
    '{"error":{"code":403,"message":"The Gemini API free tier is not available for this project. To use the Gemini API, please set up billing to upgrade to the paid tier.","status":"PERMISSION_DENIED"}}'
  );
  const classified = classifyGeminiError(rawError);
  assert.equal(classified.category, 'billing_disabled');
  assert.equal(classified.statusCode, 403);
  assert.equal(classified.isPermanentForKey, true);
  assert.equal(classified.shouldRetry, false);
  assert.match(classified.userNotice, /Settings > Secrets/);
});

test('classifies 400 API_KEY_INVALID and 429 RESOURCE_EXHAUSTED appropriately', () => {
  const invalidKey = classifyGeminiError(
    new Error('{"error":{"code":400,"message":"API key not valid","status":"INVALID_ARGUMENT"}}')
  );
  assert.equal(invalidKey.category, 'invalid_key');
  assert.equal(invalidKey.isPermanentForKey, true);
  assert.equal(invalidKey.shouldRetry, false);

  const rateLimited = classifyGeminiError(
    new Error('{"error":{"code":429,"message":"Quota exceeded","status":"RESOURCE_EXHAUSTED"}}')
  );
  assert.equal(rateLimited.category, 'rate_limited');
  assert.equal(rateLimited.isPermanentForKey, false);
  assert.equal(rateLimited.shouldRetry, true);
});

test('latches key-scoped cooldown for permanent key errors and clears after expiry', () => {
  resetGeminiCircuitForTest();
  const key = 'test-key-123';
  const t0 = 1_000_000;

  assert.equal(getGeminiCircuitState(key, t0), null);
  recordGeminiFailure(
    key,
    new Error('{"error":{"code":403,"message":"free tier is not available","status":"PERMISSION_DENIED"}}'),
    t0
  );

  const active = getGeminiCircuitState(key, t0 + 1000);
  assert.ok(active);
  assert.equal(active.category, 'billing_disabled');

  const expired = getGeminiCircuitState(key, t0 + 11 * 60 * 1000);
  assert.equal(expired, null);
});

test('runWithGeminiRetry retries transient errors once and never retries 403 permission errors', async () => {
  let transientAttempts = 0;
  const okResult = await runWithGeminiRetry(
    async () => {
      transientAttempts++;
      if (transientAttempts === 1) {
        throw new Error('{"error":{"code":503,"message":"Service unavailable"}}');
      }
      return 'ok';
    },
    { maxRetries: 1, baseDelayMs: 5 }
  );
  assert.equal(okResult, 'ok');
  assert.equal(transientAttempts, 2);

  let permissionAttempts = 0;
  await assert.rejects(
    () =>
      runWithGeminiRetry(
        async () => {
          permissionAttempts++;
          throw new Error('{"error":{"code":403,"status":"PERMISSION_DENIED","message":"free tier is not available"}}');
        },
        { maxRetries: 2, baseDelayMs: 5 }
      ),
    /PERMISSION_DENIED/
  );
  assert.equal(permissionAttempts, 1);
});
