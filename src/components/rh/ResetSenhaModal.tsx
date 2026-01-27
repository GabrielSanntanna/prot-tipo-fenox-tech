import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Eye, EyeOff, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'As senhas não conferem',
  path: ['confirm_password'],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetSenhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  onSuccess?: () => void;
}

function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const all = uppercase + lowercase + numbers;
  
  let password = '';
  
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill the rest
  for (let i = 0; i < 5; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function ResetSenhaModal({ open, onOpenChange, employee, onSuccess }: ResetSenhaModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  const handleGeneratePassword = () => {
    const password = generateRandomPassword();
    form.setValue('new_password', password);
    form.setValue('confirm_password', password);
    setShowPassword(true);
  };

  const handleSubmit = async (values: ResetPasswordValues) => {
    if (!employee || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('reset-employee-password', {
        body: {
          employee_id: employee.id,
          new_password: values.new_password,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Senha resetada',
        description: data?.message || 'A senha foi resetada com sucesso.',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    onOpenChange(false);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resetar Senha</DialogTitle>
          <DialogDescription>
            {employee.first_name} {employee.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha Temporária *</FormLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePassword}
                      title="Gerar senha aleatória"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Mínimo 8 caracteres, 1 maiúscula e 1 número
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha *</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                O colaborador será obrigado a trocar esta senha no próximo login.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resetar Senha
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
