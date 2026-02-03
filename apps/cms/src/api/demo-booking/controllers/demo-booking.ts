/**
 * demo-booking controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::demo-booking.demo-booking', ({ strapi }) => ({
  async create(ctx) {
    // Generate booking number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingNumber = `BKG-${timestamp}-${random}`;

    // Add booking number to request body
    ctx.request.body.data = {
      ...ctx.request.body.data,
      bookingNumber,
    };

    // Call the default create
    const response = await super.create(ctx);
    return response;
  },
}));
