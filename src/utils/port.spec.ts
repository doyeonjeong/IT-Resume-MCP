import { resolvePort } from './port';

describe('resolvePort', () => {
  it('returns parsed value for valid port', () => {
    expect(resolvePort('8080')).toBe(8080);
  });

  it('returns default when value is undefined', () => {
    expect(resolvePort(undefined)).toBe(3000);
  });

  it('returns default when value is empty', () => {
    expect(resolvePort('')).toBe(3000);
  });

  it('returns default for non-integer strings', () => {
    expect(resolvePort('abc')).toBe(3000);
  });

  it('returns default when out of range', () => {
    expect(resolvePort('70000')).toBe(3000);
    expect(resolvePort('0')).toBe(3000);
  });
});
