import { cn } from '@/lib/utils';

interface PinInputProps {
  value: string;
  maxLength?: number;
  className?: string;
}

export default function PinInput({ value, maxLength = 6, className }: PinInputProps) {
  const dots = Array.from({ length: maxLength }, (_, i) => i < value.length);

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {dots.map((filled, index) => (
        <div
          key={index}
          className={cn(
            'w-4 h-4 rounded-full border-2 transition-all duration-200',
            filled
              ? 'bg-primary border-primary scale-110'
              : 'bg-transparent border-muted-foreground/40'
          )}
        />
      ))}
    </div>
  );
}
