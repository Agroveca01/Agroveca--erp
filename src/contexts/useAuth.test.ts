import { describe, expect, it } from 'vitest';

import { getAuthContextOrThrow } from './useAuth';

describe('getAuthContextOrThrow', () => {
  it('returns the provided context when it exists', () => {
    const context = { isAdmin: true };
    expect(getAuthContextOrThrow(context)).toBe(context);
  });

  it('throws the expected error when context is undefined', () => {
    expect(() => getAuthContextOrThrow(undefined)).toThrow('useAuth must be used within an AuthProvider');
  });
});
