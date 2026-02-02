/**
 * contact-submission controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::contact-submission.contact-submission', ({ strapi }) => ({
  // Override create to add custom logic
  async create(ctx) {
    // Get request data
    const { data } = ctx.request.body;

    // Add metadata from request
    const enrichedData = {
      ...data,
      source: data.source || 'website',
      status: 'new',
    };

    // Create the submission
    ctx.request.body.data = enrichedData;
    
    // Call the default create
    const response = await super.create(ctx);

    // Log the submission for monitoring
    strapi.log.info(`New contact submission from: ${data.email}`);

    return response;
  },
}));
