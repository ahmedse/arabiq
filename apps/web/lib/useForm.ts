'use client';

import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

// Base type for form values - allows any object with string keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>;

// Validation rule types
type ValidationRule<T extends FormValues> = {
  validate: (value: T[keyof T], values: T) => boolean;
  message: string;
};

type FieldValidators<T extends FormValues> = {
  [K in keyof T]?: ValidationRule<T>[];
};

type FieldErrors<T extends FormValues> = {
  [K in keyof T]?: string;
};

type TouchedFields<T extends FormValues> = {
  [K in keyof T]?: boolean;
};

// Common validation functions
export const validators = {
  required: <T extends FormValues>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value === true;
      return value !== null && value !== undefined;
    },
    message,
  }),

  email: <T extends FormValues>(message = 'Please enter a valid email address'): ValidationRule<T> => ({
    validate: (value) => {
      if (!value || typeof value !== 'string') return true; // Skip if empty (use required for that)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  phone: <T extends FormValues>(message = 'Please enter a valid phone number'): ValidationRule<T> => ({
    validate: (value) => {
      if (!value || typeof value !== 'string') return true;
      // Allow various phone formats
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}$/;
      return phoneRegex.test(value.replace(/\s/g, ''));
    },
    message,
  }),

  minLength: <T extends FormValues>(min: number, message?: string): ValidationRule<T> => ({
    validate: (value) => {
      if (!value || typeof value !== 'string') return true;
      return value.length >= min;
    },
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: <T extends FormValues>(max: number, message?: string): ValidationRule<T> => ({
    validate: (value) => {
      if (!value || typeof value !== 'string') return true;
      return value.length <= max;
    },
    message: message || `Must be no more than ${max} characters`,
  }),

  pattern: <T extends FormValues>(regex: RegExp, message: string): ValidationRule<T> => ({
    validate: (value) => {
      if (!value || typeof value !== 'string') return true;
      return regex.test(value);
    },
    message,
  }),

  match: <T extends FormValues>(
    fieldName: keyof T, 
    message = 'Fields do not match'
  ): ValidationRule<T> => ({
    validate: (value, values) => value === values[fieldName],
    message,
  }),
};

export interface UseFormOptions<T extends FormValues> {
  initialValues: T;
  validators?: FieldValidators<T>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T extends FormValues> {
  values: T;
  errors: FieldErrors<T>;
  touched: TouchedFields<T>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  
  // Field handlers
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  
  // Form handlers
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
  validateField: <K extends keyof T>(field: K) => string | undefined;
  validateForm: () => boolean;
  
  // Helper for field props
  getFieldProps: (field: keyof T) => {
    name: string;
    value: T[keyof T];
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    error?: string;
  };
}

export function useForm<T extends FormValues>({
  initialValues,
  validators: fieldValidators = {} as FieldValidators<T>,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<TouchedFields<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if form is dirty (values differ from initial)
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Validate a single field
  const validateField = useCallback(
    <K extends keyof T>(field: K): string | undefined => {
      const rules = fieldValidators[field];
      if (!rules) return undefined;

      for (const rule of rules) {
        if (!rule.validate(values[field], values)) {
          return rule.message;
        }
      }
      return undefined;
    },
    [fieldValidators, values]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FieldErrors<T> = {};
    let isValid = true;

    for (const field of Object.keys(values) as Array<keyof T>) {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  // Check if form is currently valid
  const isValid = Object.keys(errors).length === 0;

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({ ...prev, [name]: newValue }));

      if (validateOnChange) {
        const error = validateField(name as keyof T);
        setErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        // Clear error when user starts typing
        if (errors[name as keyof T]) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[name as keyof T];
            return next;
          });
        }
      }
    },
    [validateOnChange, validateField, errors]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const error = validateField(name as keyof T);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateOnBlur, validateField]
  );

  // Set a specific field value
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Set a specific field error
  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string | undefined) => {
    setErrors((prev) => {
      if (error === undefined) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  // Set a specific field touched state
  const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as TouchedFields<T>
      );
      setTouched(allTouched);

      // Validate form
      const formIsValid = validateForm();
      if (!formIsValid) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Helper to get common field props
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field as string,
      value: values[field],
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[field] ? errors[field] : undefined,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    handleSubmit,
    reset,
    validateField,
    validateForm,
    getFieldProps,
  };
}
