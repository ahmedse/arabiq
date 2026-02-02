import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; IconComponent: typeof AlertCircle }> = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-500',
    IconComponent: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
    IconComponent: AlertCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'text-amber-500',
    IconComponent: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-500',
    IconComponent: Info,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const styles = variantStyles[variant];
  const IconComponent = styles.IconComponent;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        styles.container,
        className
      )}
    >
      <IconComponent className={cn("w-5 h-5 flex-shrink-0 mt-0.5", styles.icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-semibold mb-1">{title}</h3>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
