/**
 * Override users-permissions auth controller to add custom registration logic
 */

module.exports = (plugin) => {
  // Registration is handled via custom endpoint at /api/auth/register (see src/api/custom-auth)
  // The previous register override was removed to avoid Strapi rejecting custom registration fields



  // Override login to add audit logging
  const originalCallback = plugin.controllers.auth.callback;
  plugin.controllers.auth.callback = async (ctx) => {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    if (provider === 'local') {
      const { identifier } = params;

      // Find user
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier },
          ],
        },
        populate: ['role'],
      });

      try {
        // Call original callback
        await originalCallback(ctx);

        // If successful, log it and update lastLoginAt
        if (user && ctx.response.status === 200) {
          await strapi.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          await strapi.entityService.create('api::user-audit-log.user-audit-log', {
            data: {
              user: user.id,
              action: 'login',
              ipAddress: ctx.request.ip,
              userAgent: ctx.request.header['user-agent'],
              success: true,
            },
          });
        }
      } catch (error) {
        // Log failed login
        await strapi.entityService.create('api::user-audit-log.user-audit-log', {
          data: {
            user: user?.id || null,
            action: 'failed_login',
            ipAddress: ctx.request.ip,
            userAgent: ctx.request.header['user-agent'],
            metadata: { identifier },
            success: false,
            errorMessage: error.message,
          },
        });

        throw error;
      }
    } else {
      await originalCallback(ctx);
    }
  };

  // Add custom logout endpoint with audit logging
  plugin.controllers.auth.logout = async (ctx) => {
    const user = ctx.state.user;

    if (user) {
      await strapi.entityService.create('api::user-audit-log.user-audit-log', {
        data: {
          user: user.id,
          action: 'logout',
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.header['user-agent'],
          success: true,
        },
      });
    }

    ctx.send({ message: 'Logged out successfully' });
  };

  return plugin;
};
