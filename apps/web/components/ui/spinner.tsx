import { cn } from '@/lib/utils';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "inline-block rounded-full border-indigo-600 border-t-transparent animate-spin",
        sizeStyles[size],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface SpinnerOverlayProps {
  label?: string;
}

export function SpinnerOverlay({ label = 'Loading...' }: SpinnerOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" />
        <p className="text-slate-600 font-medium">{label}</p>
      </div>
    </div>
  );
}
