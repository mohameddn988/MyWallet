/**
 * Recursively strips keys that could enable NoSQL injection or prototype pollution.
 * Removes any key starting with "$" and dangerous prototype keys.
 */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function sanitize<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item)) as unknown as T;
  }

  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (key.startsWith("$") || DANGEROUS_KEYS.has(key)) continue;
    clean[key] = sanitize((value as Record<string, unknown>)[key]);
  }
  return clean as T;
}
