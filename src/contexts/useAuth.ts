import { useContext } from 'react';
import { AuthContext } from './authContextCore';

export const getAuthContextOrThrow = <T>(context: T | undefined): T => {
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export function useAuth() {
  return getAuthContextOrThrow(useContext(AuthContext));
}
