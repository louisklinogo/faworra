export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/[_-]{2,}/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 30);
}

export function nextUniqueId(base: string, taken: Set<string>) {
  if (!base) return base;
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const value = `${base}-${i}`;
    if (!taken.has(value)) return value;
  }
  return `${base}-${Date.now().toString(36)}`;
}
