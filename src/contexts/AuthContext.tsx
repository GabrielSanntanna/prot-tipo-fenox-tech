import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { cleanDocument, validateCPF } from '@/utils/cpfValidator';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithCPF: (cpf: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Login via CPF + senha
   * 1. Busca o email associado ao CPF na tabela employees
   * 2. Usa o email para autenticar no Supabase Auth
   */
  const signInWithCPF = async (cpf: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase não configurado') };
    }

    const cleanedCPF = cleanDocument(cpf);
    
    // Validate CPF format
    if (!validateCPF(cleanedCPF)) {
      return { error: new Error('CPF inválido') };
    }

    try {
      // Find the employee with this CPF
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('email, status')
        .eq('cpf_cnpj', cleanedCPF)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching employee:', fetchError);
        return { error: new Error('Erro ao buscar colaborador') };
      }

      if (!employee) {
        return { error: new Error('CPF não encontrado no sistema') };
      }

      if (employee.status === 'terminated') {
        return { error: new Error('Colaborador desligado. Acesso não permitido.') };
      }

      // Authenticate with the found email
      const { error } = await supabase.auth.signInWithPassword({
        email: employee.email,
        password,
      });

      return { error };
    } catch (err) {
      console.error('Login error:', err);
      return { error: err instanceof Error ? err : new Error('Erro desconhecido') };
    }
  };

  // Keep legacy email login for compatibility
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isConfigured: isSupabaseConfigured, 
      signInWithCPF,
      signIn, 
      signUp, 
      signOut 
    }}>
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
