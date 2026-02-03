/**
 * demo-inquiry controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::demo-inquiry.demo-inquiry', ({ strapi }) => ({
  async create(ctx) {
    // Generate inquiry number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inquiryNumber = `INQ-${timestamp}-${random}`;

    // Add inquiry number to request body
    ctx.request.body.data = {
      ...ctx.request.body.data,
      inquiryNumber,
    };

    // Call the default create
    const response = await super.create(ctx);
    return response;
  },
}));
