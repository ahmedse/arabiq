/**
 * demo-reservation controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::demo-reservation.demo-reservation', ({ strapi }) => ({
  async create(ctx) {
    // Generate reservation number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservationNumber = `RES-${timestamp}-${random}`;

    // Add reservation number to request body
    ctx.request.body.data = {
      ...ctx.request.body.data,
      reservationNumber,
    };

    // Call the default create
    const response = await super.create(ctx);
    return response;
  },
}));
