/**
 * demo-visitor-session router
 */

export default {
  routes: [
    // Custom routes
    {
      method: 'PUT',
      path: '/demo-visitor-sessions/:id/position',
      handler: 'demo-visitor-session.updatePosition',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/demo-visitor-sessions/active/:demoId',
      handler: 'demo-visitor-session.getActiveSessions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Default CRUD routes
    {
      method: 'GET',
      path: '/demo-visitor-sessions',
      handler: 'demo-visitor-session.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/demo-visitor-sessions/:id',
      handler: 'demo-visitor-session.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/demo-visitor-sessions',
      handler: 'demo-visitor-session.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/demo-visitor-sessions/:id',
      handler: 'demo-visitor-session.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/demo-visitor-sessions/:id',
      handler: 'demo-visitor-session.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
