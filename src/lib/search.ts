export const asText = (value: unknown): string => String(value ?? '');

export const compact = (value: unknown, max = 128): string => asText(value).replace(/\s+/g, ' ').slice(0, max);

export const matches = (item: unknown, query: string): boolean =>
  !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
