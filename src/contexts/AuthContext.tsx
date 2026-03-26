import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { CanonicalUserRole, normalizeUserRole, supabase, UserProfile, UserProfileRole } from '../lib/supabase';
import { buildRecoveryClearedUrl, isRecoveryUrl } from './authRecovery';

const clearRecoveryHash = () => {
  if (typeof window === 'undefined' || !window.location.hash) {
    return;
  }

  window.history.replaceState(
    {},
    document.title,
    buildRecoveryClearedUrl(window.location.pathname, window.location.search),
  );
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  normalizedRole: CanonicalUserRole | null;
  isAdmin: boolean;
  isOperator: boolean;
  isSeller: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    setIsPasswordRecovery(isRecoveryUrl(window.location.hash));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || isRecoveryUrl(window.location.hash)) {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT' || !session) {
        setIsPasswordRecovery(false);
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle<UserProfile>();

      if (error) throw error;

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      setIsPasswordRecovery(false);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });


      if (authError) return { error: authError };

      if (authData.user && authData.session) {
        await loadProfile(authData.user.id);
      }

      setIsPasswordRecovery(false);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) return { error };

      setLoading(true);
      clearRecoveryHash();
      await supabase.auth.signOut();
      setIsPasswordRecovery(false);

      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
  };

  const normalizedRole = normalizeUserRole(profile?.role);

  const value = {
    user,
    profile,
    session,
    loading,
    normalizedRole,
    isAdmin: normalizedRole === UserProfileRole.Admin,
    isOperator: normalizedRole === UserProfileRole.Operario,
    isSeller: normalizedRole === UserProfileRole.Vendedor,
    isPasswordRecovery,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
