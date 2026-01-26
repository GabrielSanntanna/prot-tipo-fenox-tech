import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TecladoNumerico from '@/components/tablet/TecladoNumerico';
import PinInput from '@/components/tablet/PinInput';
import ConfirmacaoDados from '@/components/tablet/ConfirmacaoDados';
import CapturaFoto from '@/components/tablet/CapturaFoto';
import MensagemFeedback from '@/components/tablet/MensagemFeedback';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EDGE_FUNCTION_URL = 'https://heynxljdvdktgsmlimkd.supabase.co/functions/v1/tablet-time-clock';

type Step = 'pin' | 'confirm' | 'photo' | 'success' | 'error';

interface EmployeeData {
  id: string;
  nome: string;
  departamento?: string;
  fotoUrl?: string | null;
}

export default function PontoTablet() {
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredTime, setRegisteredTime] = useState('');
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const resetFlow = useCallback(() => {
    setStep('pin');
    setPin('');
    setEmployee(null);
    setErrorMessage('');
    setRegisteredTime('');
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + key);
    }
  }, [pin]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handlePinConfirm = useCallback(async () => {
    if (pin.length < 4) {
      toast({
        title: 'PIN inválido',
        description: 'Digite pelo menos 4 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use edge function for PIN verification (no auth required)
      const response = await fetch(`${EDGE_FUNCTION_URL}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'PIN não encontrado ou colaborador inativo.');
        setStep('error');
        return;
      }

      setEmployee({
        id: data.id,
        nome: data.nome,
        departamento: data.departamento,
        fotoUrl: data.fotoUrl,
      });
      setStep('confirm');
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setErrorMessage('Erro ao verificar PIN. Tente novamente.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [pin, toast]);

  const handleConfirmIdentity = useCallback(() => {
    setStep('photo');
  }, []);

  const handleCancelIdentity = useCallback(() => {
    resetFlow();
  }, [resetFlow]);

  const handlePhotoCapture = useCallback(async (photoDataUrl: string) => {
    if (!employee) return;

    setIsLoading(true);

    try {
      // Upload the photo to storage (anonymous upload might fail, handle gracefully)
      let photoUrl: string | undefined;
      
      try {
        const fileName = `${employee.id}/${Date.now()}.jpg`;
        const base64Data = photoDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const { error: uploadError } = await supabase.storage
          .from('time-clock-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('time-clock-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Photo upload failed, proceeding without photo:', uploadErr);
      }

      // Use edge function for time record registration
      const response = await fetch(`${EDGE_FUNCTION_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          photo_url: photoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar ponto');
      }

      setRegisteredTime(format(new Date(data.time), 'HH:mm:ss'));
      setStep('success');
    } catch (err) {
      console.error('Error registering time:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao registrar ponto');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [employee]);

  const handleCancelPhoto = useCallback(() => {
    setStep('confirm');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex flex-col">
      {/* Header */}
      <header className="p-6 text-center border-b bg-background/80 backdrop-blur">
        <h1 className="text-3xl font-bold text-primary">Ponto Eletrônico</h1>
        <div className="flex items-center justify-center gap-2 mt-2 text-4xl font-mono font-bold">
          <Clock className="h-8 w-8" />
          {format(currentTime, 'HH:mm:ss')}
        </div>
        <p className="text-muted-foreground text-lg mt-1">
          {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {step === 'pin' && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Digite seu PIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <PinInput value={pin} maxLength={6} className="py-4" />
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : (
                <TecladoNumerico
                  onKeyPress={handleKeyPress}
                  onDelete={handleDelete}
                  onConfirm={handlePinConfirm}
                  disabled={isLoading}
                />
              )}
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && employee && (
          <ConfirmacaoDados
            nome={employee.nome}
            departamento={employee.departamento}
            fotoUrl={employee.fotoUrl}
            onConfirm={handleConfirmIdentity}
            onCancel={handleCancelIdentity}
            isLoading={isLoading}
          />
        )}

        {step === 'photo' && (
          <CapturaFoto
            onCapture={handlePhotoCapture}
            onCancel={handleCancelPhoto}
            isUploading={isLoading}
          />
        )}

        {step === 'success' && (
          <MensagemFeedback
            tipo="sucesso"
            titulo="Ponto Registrado!"
            mensagem={`${employee?.nome}, seu ponto foi registrado com sucesso.`}
            horario={registeredTime}
            onClose={resetFlow}
          />
        )}

        {step === 'error' && (
          <MensagemFeedback
            tipo="erro"
            titulo="Erro no Registro"
            mensagem={errorMessage}
            onClose={resetFlow}
            autoCloseMs={0}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        Sistema de Ponto Eletrônico • Terminal de Autoatendimento
      </footer>
    </div>
  );
}
