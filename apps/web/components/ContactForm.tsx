'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { useForm, validators } from '@/lib/useForm';
import { Send, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface ContactFormProps {
  locale: string;
  labels: {
    formTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    phoneLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    sendingText: string;
    successTitle: string;
    successMessage: string;
    errorMessage: string;
  };
}

interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function ContactForm({ locale, labels }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isRTL = locale === 'ar';

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = useForm<ContactFormValues>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
    validators: {
      name: [
        validators.required(isRTL ? 'الاسم مطلوب' : 'Name is required'),
        validators.minLength(2, isRTL ? 'الاسم قصير جداً' : 'Name is too short'),
      ],
      email: [
        validators.required(isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required'),
        validators.email(isRTL ? 'البريد الإلكتروني غير صحيح' : 'Please enter a valid email'),
      ],
      phone: [
        validators.phone(isRTL ? 'رقم الهاتف غير صحيح' : 'Please enter a valid phone number'),
      ],
      message: [
        validators.required(isRTL ? 'الرسالة مطلوبة' : 'Message is required'),
        validators.minLength(10, isRTL ? 'الرسالة قصيرة جداً' : 'Message must be at least 10 characters'),
      ],
    },
    onSubmit: async (formValues) => {
      setSubmitError(null);
      
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formValues,
            locale,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const errorMsg = isRTL 
              ? 'لقد أرسلت الكثير من الرسائل. يرجى المحاولة لاحقاً.' 
              : 'Too many submissions. Please try again later.';
            setSubmitError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          // Handle validation errors from server
          if (data.errors) {
            const firstError = Object.values(data.errors)[0] as string;
            setSubmitError(firstError);
            toast.error(firstError);
            return;
          }

          throw new Error(data.error || 'Submission failed');
        }

        // Success!
        setSubmitted(true);
        toast.success(labels.successMessage);
        reset();
        
      } catch (error) {
        console.error('Contact form error:', error);
        const errorMsg = labels.errorMessage;
        setSubmitError(errorMsg);
        toast.error(errorMsg);
      }
    },
    validateOnBlur: true,
    validateOnChange: false,
  });

  // Show success state after submission
  if (submitted) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 lg:p-10">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{labels.successTitle}</h2>
          <p className="text-slate-600 mb-6">{labels.successMessage}</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {isRTL ? 'إرسال رسالة أخرى' : 'Send another message'}
          </button>
        </div>
        <Toaster position={isRTL ? 'top-left' : 'top-right'} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-8 lg:p-10">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">{labels.formTitle}</h2>

      {submitError && (
        <Alert variant="error" className="mb-6" dismissible onDismiss={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Input
          label={labels.nameLabel}
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name ? errors.name : undefined}
          placeholder={labels.namePlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
          required
          disabled={isSubmitting}
        />

        <Input
          label={labels.emailLabel}
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email ? errors.email : undefined}
          placeholder="email@example.com"
          dir="ltr"
          required
          disabled={isSubmitting}
        />

        <Input
          label={labels.phoneLabel}
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.phone ? errors.phone : undefined}
          placeholder="+20 123 456 7890"
          dir="ltr"
          disabled={isSubmitting}
        />

        <Textarea
          label={labels.messageLabel}
          name="message"
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.message ? errors.message : undefined}
          placeholder={labels.messagePlaceholder}
          rows={5}
          dir={isRTL ? 'rtl' : 'ltr'}
          required
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="border-white border-t-transparent" />
              {labels.sendingText}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {labels.submitButton}
            </>
          )}
        </button>
      </form>
      
      <Toaster position={isRTL ? 'top-left' : 'top-right'} />
    </div>
  );
}
