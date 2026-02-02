import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    const checkboxId = id || props.name;
    
    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={cn(
                "peer w-5 h-5 rounded border-2 bg-white appearance-none cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "transition-all duration-200",
                "checked:bg-indigo-600 checked:border-indigo-600",
                error 
                  ? "border-red-500" 
                  : "border-slate-300 hover:border-slate-400",
                className
              )}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? `${checkboxId}-error` : description ? `${checkboxId}-desc` : undefined}
              {...props}
            />
            <Check 
              className="absolute w-3.5 h-3.5 text-white pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity"
            />
          </div>
          {label && (
            <div className="flex-1">
              <label 
                htmlFor={checkboxId} 
                className="text-sm font-medium text-slate-700 cursor-pointer select-none"
              >
                {label}
                {props.required && <span className="text-red-500 ms-0.5">*</span>}
              </label>
              {description && (
                <p id={`${checkboxId}-desc`} className="text-sm text-slate-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p id={`${checkboxId}-error`} className="text-sm text-red-600 ps-8" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
