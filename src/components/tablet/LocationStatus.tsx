import { MapPin, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationStatusProps {
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'error' | 'no-locations';
  locationName?: string;
  distance?: number;
  errorMessage?: string;
  className?: string;
}

export default function LocationStatus({
  status,
  locationName,
  distance,
  errorMessage,
  className,
}: LocationStatusProps) {
  const statusConfig = {
    idle: {
      icon: MapPin,
      text: 'Aguardando localização...',
      bgColor: 'bg-muted',
      textColor: 'text-muted-foreground',
      iconColor: 'text-muted-foreground',
    },
    loading: {
      icon: Loader2,
      text: 'Obtendo localização...',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-500',
      animate: true,
    },
    valid: {
      icon: CheckCircle,
      text: locationName ? `Local válido: ${locationName}` : 'Localização válida',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-500',
    },
    invalid: {
      icon: XCircle,
      text: distance 
        ? `Fora da área permitida (${Math.round(distance)}m de distância)` 
        : 'Localização fora da área permitida',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-500',
    },
    error: {
      icon: AlertTriangle,
      text: errorMessage || 'Erro ao obter localização',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconColor: 'text-yellow-500',
    },
    'no-locations': {
      icon: AlertTriangle,
      text: 'Nenhum local configurado. Ponto será registrado sem validação.',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconColor: 'text-yellow-500',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-4',
        config.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          'h-6 w-6 flex-shrink-0',
          config.iconColor,
          'animate' in config && config.animate && 'animate-spin'
        )}
      />
      <span className={cn('text-sm font-medium', config.textColor)}>
        {config.text}
      </span>
    </div>
  );
}
