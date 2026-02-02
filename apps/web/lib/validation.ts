/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';

// --- Base Schemas ---

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email too long')
  .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const phoneSchema = z
  .string()
  .max(20, 'Phone number too long')
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

// --- Form Schemas ---

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required')
    .max(100, 'Name too long')
    .transform((v) => v.trim()),
  email: emailSchema,
  phone: phoneSchema,
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message too long')
    .transform((v) => v.trim()),
  locale: z.enum(['en', 'ar']).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or username is required')
    .max(255)
    .transform((v) => v.trim()),
  password: z.string().min(1, 'Password is required'),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2).max(100).optional(),
  phone: phoneSchema,
  company: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  salesContactAllowed: z.boolean().optional(),
});

export type RegisterData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  code: z.string().min(1, 'Reset code is required'),
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  phone: phoneSchema,
  company: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

// --- Utility Functions ---

/**
 * Validate input data against a Zod schema
 * Returns either validated data or field-level errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  // Zod 4 uses .issues instead of .errors
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || '_root';
    // Only keep the first error for each field
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors: Record<string, string>) {
  return Response.json(
    {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    },
    { status: 400 }
  );
}

/**
 * Sanitize a string (trim and limit length)
 */
export function sanitize(str: string, maxLength: number = 5000): string {
  return str.trim().slice(0, maxLength);
}
