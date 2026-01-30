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
      method: 'GET',
      path: '/custom-auth/me',
      handler: 'custom-auth.me',
      config: {
        middlewares: [],
      },
    },
  ],
};