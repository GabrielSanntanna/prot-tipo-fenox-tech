import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ConfirmacaoDadosProps {
  nome: string;
  departamento?: string;
  fotoUrl?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmacaoDados({
  nome,
  departamento,
  fotoUrl,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmacaoDadosProps) {
  const initials = nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-8 pb-6 text-center space-y-6">
        <Avatar className="h-32 w-32 mx-auto border-4 border-primary/20">
          <AvatarImage src={fotoUrl || undefined} alt={nome} />
          <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">É você, {nome.split(' ')[0]}?</h2>
          {departamento && (
            <p className="text-muted-foreground text-lg">{departamento}</p>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={onCancel}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Não sou eu
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={onConfirm}
            disabled={isLoading}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Sim, sou eu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
