import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCPF, cleanDocument, validateCPF } from '@/utils/cpfValidator';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithCPF, isConfigured, user, loading } = useAuth();
  const { toast } = useToast();

  // If already logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured) {
      toast({
        variant: 'destructive',
        title: 'Supabase não configurado',
        description: 'Por favor, configure as variáveis de ambiente do Supabase'
      });
      return;
    }

    const cleanedCPF = cleanDocument(cpf);
    
    if (!validateCPF(cleanedCPF)) {
      toast({
        variant: 'destructive',
        title: 'CPF inválido',
        description: 'Por favor, digite um CPF válido'
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signInWithCPF(cpf, password);

    if (error) {
      let errorMessage = error.message;
      
      // Translate common errors
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'CPF ou senha incorretos';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: errorMessage
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">FMS</h1>
          <p className="text-sm text-muted-foreground">Fenox Management System</p>
        </div>

        {/* Configuration warning */}
        {!isConfigured && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Supabase não configurado</p>
                <p className="text-muted-foreground mt-1">
                  Aguardando as variáveis de ambiente serem carregadas. Tente recarregar a página.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>
              Digite seu CPF e senha para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  required
                  autoComplete="username"
                  maxLength={14}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !isConfigured}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Link to="/recuperar-senha" className="hover:text-primary hover:underline">
                  Esqueceu sua senha?
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2024 FMS - Fenox Management System
        </p>
      </div>
    </div>
  );
}
