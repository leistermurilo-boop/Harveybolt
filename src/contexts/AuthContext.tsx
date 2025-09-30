import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Company } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  company: Company | null;
  loading: boolean;
  signUp: (email: string, password: string, companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'logo_url'>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async (userId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setCompany(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompany(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchCompany(session.user.id);
        } else {
          setCompany(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'logo_url'>
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: companyError } = await supabase.from('companies').insert({
        user_id: data.user.id,
        name: companyData.name,
        cnpj: companyData.cnpj,
        email: companyData.email,
        phone: companyData.phone || '',
        address: companyData.address || '',
        logo_url: '',
      });

      if (companyError) throw companyError;
      await fetchCompany(data.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshCompany = async () => {
    if (user) {
      await fetchCompany(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, signUp, signIn, signOut, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
