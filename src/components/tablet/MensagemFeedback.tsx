import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MensagemFeedbackProps {
  tipo: 'sucesso' | 'erro';
  titulo: string;
  mensagem?: string;
  horario?: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export default function MensagemFeedback({
  tipo,
  titulo,
  mensagem,
  horario,
  onClose,
  autoCloseMs = 5000,
}: MensagemFeedbackProps) {
  // Auto-close after specified time
  if (autoCloseMs > 0) {
    setTimeout(onClose, autoCloseMs);
  }

  return (
    <Card
      className={cn(
        'w-full max-w-md mx-auto border-2',
        tipo === 'sucesso' ? 'border-green-500/50 bg-green-500/5' : 'border-destructive/50 bg-destructive/5'
      )}
    >
      <CardContent className="pt-8 pb-6 text-center space-y-4">
        {tipo === 'sucesso' ? (
          <CheckCircle2 className="h-20 w-20 mx-auto text-green-500" />
        ) : (
          <XCircle className="h-20 w-20 mx-auto text-destructive" />
        )}

        <div className="space-y-2">
          <h2
            className={cn(
              'text-2xl font-bold',
              tipo === 'sucesso' ? 'text-green-600' : 'text-destructive'
            )}
          >
            {titulo}
          </h2>
          {mensagem && <p className="text-muted-foreground text-lg">{mensagem}</p>}
        </div>

        {horario && tipo === 'sucesso' && (
          <div className="flex items-center justify-center gap-2 text-xl font-mono text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>{horario}</span>
          </div>
        )}

        <Button size="lg" className="w-full h-14 text-lg mt-6" onClick={onClose}>
          {tipo === 'sucesso' ? 'Novo Registro' : 'Tentar Novamente'}
        </Button>
      </CardContent>
    </Card>
  );
}
