import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label 
          htmlFor={htmlFor} 
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ms-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-sm text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
