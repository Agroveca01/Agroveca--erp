import { describe, expect, it } from 'vitest';

import { buildRecoveryClearedUrl, isRecoveryUrl } from './authRecovery';

describe('auth recovery helpers', () => {
  it('detects recovery hashes with or without the leading hash character', () => {
    expect(isRecoveryUrl('#type=recovery')).toBe(true);
    expect(isRecoveryUrl('type=recovery&access_token=abc')).toBe(true);
  });

  it('returns false for non-recovery or empty hashes', () => {
    expect(isRecoveryUrl('#type=signup')).toBe(false);
    expect(isRecoveryUrl('')).toBe(false);
    expect(isRecoveryUrl(undefined)).toBe(false);
  });

  it('builds the URL used to clear the recovery hash while preserving search params', () => {
    expect(buildRecoveryClearedUrl('/reset-password', '?from=email')).toBe('/reset-password?from=email');
    expect(buildRecoveryClearedUrl('/reset-password', '')).toBe('/reset-password');
  });
});
