import { useEffect, useState, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  loading: true,
  error: null,
});

const LOCAL_EMAIL = 'vault@local.app';
const LOCAL_PASSWORD = 'local-finance-tracker-123';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else {
        // Auto-login or register the single local user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: LOCAL_EMAIL,
          password: LOCAL_PASSWORD,
        });

        if (signInError || !signInData.session) {
          // If login fails, try to sign up
          const { error: signUpErr } = await supabase.auth.signUp({
            email: LOCAL_EMAIL,
            password: LOCAL_PASSWORD,
          });
          
          if (signUpErr) {
            console.error('Sign up error:', signUpErr);
          }

          // After sign up, login again to get session
          const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
            email: LOCAL_EMAIL,
            password: LOCAL_PASSWORD,
          });

          if (newSignInError || !newSignInData.session) {
             console.error('Second sign in error:', newSignInError);
             setError(newSignInError?.message || 'Failed to authenticate newly created user. Check Email Confirmations.');
          }

          setSession(newSignInData.session);
          setUser(newSignInData.session?.user ?? null);
        } else {
          setSession(signInData.session);
          setUser(signInData.session.user);
        }
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
