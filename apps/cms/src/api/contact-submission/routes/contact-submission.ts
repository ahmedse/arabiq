/**
 * contact-submission router
 * 
 * Authentication is controlled via Strapi admin panel:
 * Settings > Users & Permissions > Roles > Public
 * Enable "create" for public contact form submissions
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::contact-submission.contact-submission');
