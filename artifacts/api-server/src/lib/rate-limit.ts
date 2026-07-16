/**
 * Lightweight in-memory rate limiter.
 * Key can be userId or IP. Sliding-window per key.
 */
interface Window { count: number; resetAt: number }
const store = new Map<string, Window>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (existing.count >= maxRequests) return false; // blocked
  existing.count++;
  return true;
}

// Clean up expired windows every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.resetAt) store.delete(k);
  }
}, 5 * 60 * 1000);
