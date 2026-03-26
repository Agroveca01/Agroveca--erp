import { describe, expect, it } from 'vitest';

import { buildAuthFlags, clearRecoveryHash } from './authContextHelpers';

describe('authContextHelpers', () => {
  it('builds the expected role flags for each canonical role', () => {
    expect(buildAuthFlags('admin')).toEqual({
      normalizedRole: 'admin',
      isAdmin: true,
      isOperator: false,
      isSeller: false,
    });

    expect(buildAuthFlags('operario')).toEqual({
      normalizedRole: 'operario',
      isAdmin: false,
      isOperator: true,
      isSeller: false,
    });

    expect(buildAuthFlags('vendedor')).toEqual({
      normalizedRole: 'vendedor',
      isAdmin: false,
      isOperator: false,
      isSeller: true,
    });
  });

  it('returns all role flags as false when there is no normalized role', () => {
    expect(buildAuthFlags(null)).toEqual({
      normalizedRole: null,
      isAdmin: false,
      isOperator: false,
      isSeller: false,
    });
  });

  it('builds the recovery-cleared URL from pathname and search', () => {
    expect(clearRecoveryHash('/reset-password', '?source=email')).toBe('/reset-password?source=email');
  });
});
