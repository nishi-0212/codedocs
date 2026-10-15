// Tiny in-memory token bucket, keyed by client IP.
// Per-instance: on serverless platforms each instance has its own counter,
// which is fine as a basic abuse guard. Use Redis/Upstash if you need a global limit.

interface Bucket {
  tokens: number;
  updated: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, perMinute: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const refillPerMs = perMinute / 60_000;
  const b = buckets.get(key) ?? { tokens: perMinute, updated: now };

  b.tokens = Math.min(perMinute, b.tokens + (now - b.updated) * refillPerMs);
  b.updated = now;

  let result: { ok: boolean; retryAfter: number };
  if (b.tokens < 1) {
    result = { ok: false, retryAfter: Math.max(1, Math.ceil((1 - b.tokens) / refillPerMs / 1000)) };
  } else {
    b.tokens -= 1;
    result = { ok: true, retryAfter: 0 };
  }
  buckets.set(key, b);

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v.updated > 10 * 60_000) buckets.delete(k);
    }
  }
  return result;
}
