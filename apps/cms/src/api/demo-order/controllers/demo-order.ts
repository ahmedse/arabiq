/**
 * demo-order controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::demo-order.demo-order', ({ strapi }) => ({
  async create(ctx) {
    // Generate order number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Add order number to request body
    ctx.request.body.data = {
      ...ctx.request.body.data,
      orderNumber,
    };

    // Call the default create
    const response = await super.create(ctx);
    return response;
  },
}));
