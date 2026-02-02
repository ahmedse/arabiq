/**
 * Environment variable validation
 * Validates required environment variables at startup
 */
import { z } from 'zod';

const envSchema = z.object({
  // Strapi CMS
  STRAPI_URL: z.string().url().default('http://localhost:1337'),
  NEXT_PUBLIC_STRAPI_URL: z.string().url().default('http://localhost:1337'),
  STRAPI_API_TOKEN: z.string().optional(),

  // Site configuration
  SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    
    // In production, throw an error to prevent startup
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
    
    // In development, use defaults
    return envSchema.parse({});
  }

  return parsed.data;
}

export const env = getEnv();

/**
 * Check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Get the base URL for the site
 */
export function getSiteUrl(): string {
  return env.SITE_URL || env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

/**
 * Get the Strapi URL
 */
export function getStrapiUrl(): string {
  return env.STRAPI_URL || env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
}
