export default {
  routes: [
    {
      method: 'GET',
      path: '/user-management/users',
      handler: 'user-management.getUsers',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-management/update-status',
      handler: 'user-management.updateStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-management/elevate',
      handler: 'user-management.elevateRole',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
