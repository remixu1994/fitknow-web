export const asText = (value: unknown): string => String(value ?? '');

export const compact = (value: unknown, max = 128): string => asText(value).replace(/\s+/g, ' ').slice(0, max);

export function matches(item: unknown, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  try {
    return JSON.stringify(item).toLowerCase().includes(normalizedQuery);
  } catch {
    return false;
  }
}
