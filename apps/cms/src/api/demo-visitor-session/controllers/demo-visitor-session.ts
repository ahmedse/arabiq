/**
 * demo-visitor-session controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::demo-visitor-session.demo-visitor-session', ({ strapi }) => ({
  async create(ctx) {
    // Generate session ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionId = `VIS-${timestamp}-${random}`;

    // Add session ID and start time to request body
    ctx.request.body.data = {
      ...ctx.request.body.data,
      sessionId,
      startTime: new Date().toISOString(),
      isActive: true,
    };

    // Call the default create
    const response = await super.create(ctx);
    return response;
  },

  async updatePosition(ctx) {
    const { id } = ctx.params;
    const { position } = ctx.request.body;

    // Find the session
    const session = await strapi.entityService.findOne(
      'api::demo-visitor-session.demo-visitor-session',
      id
    );

    if (!session) {
      return ctx.notFound('Session not found');
    }

    // Update position history
    const positionHistory = session.positionHistory || [];
    positionHistory.push({
      position,
      timestamp: new Date().toISOString(),
    });

    // Update the session
    const updated = await strapi.entityService.update(
      'api::demo-visitor-session.demo-visitor-session',
      id,
      {
        data: {
          currentPosition: position,
          positionHistory,
        },
      }
    );

    return { data: updated };
  },

  async getActiveSessions(ctx) {
    const { demoId } = ctx.params;

    const sessions = await strapi.entityService.findMany(
      'api::demo-visitor-session.demo-visitor-session',
      {
        filters: {
          demo: demoId,
          isActive: true,
        },
        populate: ['demo'],
      }
    );

    return { data: sessions };
  },
}));
