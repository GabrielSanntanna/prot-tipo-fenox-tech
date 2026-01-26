import { Button } from '@/components/ui/button';
import { Delete, CornerDownLeft } from 'lucide-react';

interface TecladoNumericoProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}

export default function TecladoNumerico({
  onKeyPress,
  onDelete,
  onConfirm,
  disabled = false,
}: TecladoNumericoProps) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['delete', '0', 'confirm'],
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {keys.flat().map((key, index) => {
        if (key === 'delete') {
          return (
            <Button
              key={index}
              variant="outline"
              size="lg"
              className="h-16 text-xl font-medium"
              onClick={onDelete}
              disabled={disabled}
            >
              <Delete className="h-6 w-6" />
            </Button>
          );
        }
        if (key === 'confirm') {
          return (
            <Button
              key={index}
              variant="default"
              size="lg"
              className="h-16 text-xl font-medium"
              onClick={onConfirm}
              disabled={disabled}
            >
              <CornerDownLeft className="h-6 w-6" />
            </Button>
          );
        }
        return (
          <Button
            key={index}
            variant="secondary"
            size="lg"
            className="h-16 text-2xl font-semibold"
            onClick={() => onKeyPress(key)}
            disabled={disabled}
          >
            {key}
          </Button>
        );
      })}
    </div>
  );
}
