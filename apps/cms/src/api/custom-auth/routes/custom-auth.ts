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
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/custom-auth/me',
      handler: 'custom-auth.updateMe',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/custom-auth/change-password',
      handler: 'custom-auth.changePassword',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
        middlewares: [],
      },
    },
  ],
};