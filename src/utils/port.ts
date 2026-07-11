const DEFAULT_PORT = 3000;

export function resolvePort(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return DEFAULT_PORT;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return DEFAULT_PORT;
  }

  return parsed;
}
