declare module '@strapi/strapi' {
  /**
   * Allow using string literals like 'api::example.example' where Strapi expects ContentType
   * This narrows compatibility issues across Strapi type definitions in different versions.
   */
  export type ContentType = string;

  /**
   * Provide a minimal `factories` declaration so `import { factories } from '@strapi/strapi'`
   * works in generated code. Using `any` keeps this resilient to Strapi version differences.
   */
  export const factories: any;
}
