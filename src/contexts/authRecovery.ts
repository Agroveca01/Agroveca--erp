export const isRecoveryUrl = (hash?: string): boolean => {
  if (!hash) {
    return false;
  }

  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;

  if (!normalizedHash) {
    return false;
  }

  return new URLSearchParams(normalizedHash).get('type') === 'recovery';
};

export const buildRecoveryClearedUrl = (pathname: string, search: string): string => {
  return pathname + search;
};
