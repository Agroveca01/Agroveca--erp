import { CanonicalUserRole } from '../lib/supabase';

export interface AuthFlags {
  normalizedRole: CanonicalUserRole | null;
  isAdmin: boolean;
  isOperator: boolean;
  isSeller: boolean;
}

export const buildAuthFlags = (normalizedRole: CanonicalUserRole | null): AuthFlags => {
  return {
    normalizedRole,
    isAdmin: normalizedRole === 'admin',
    isOperator: normalizedRole === 'operario',
    isSeller: normalizedRole === 'vendedor',
  };
};

export const clearRecoveryHash = (pathname: string, search: string): string => {
  return pathname + search;
};
