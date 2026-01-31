export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-auth/register',
      handler: 'custom-auth.register',
      config: {
        auth: false,
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/custom-auth/login',
      handler: 'custom-auth.login',
      config: {
        auth: false,
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/custom-auth/me',
      handler: 'custom-auth.me',
      info: { type: 'content-api' },
      config: {
        auth: {},
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/custom-auth/me',
      handler: 'custom-auth.updateMe',
      info: { type: 'content-api' },
      config: {
        auth: {},
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/custom-auth/change-password',
      handler: 'custom-auth.changePassword',
      info: { type: 'content-api' },
      config: {
        auth: {},
        middlewares: [],
      },
    },
  ],
};