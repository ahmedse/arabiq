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

  // Override emailConfirmation to also activate account_status and return user when requested
  const originalEmailConfirmation = plugin.controllers.auth.emailConfirmation;
  plugin.controllers.auth.emailConfirmation = async (ctx, next, returnUser) => {
    try {
      // Validate input token
      const confirmationToken = ctx.query.confirmation || ctx.request.body?.confirmation;
      if (!confirmationToken) {
        // fallback to original for validation error handling
        return await originalEmailConfirmation(ctx, next, returnUser);
      }

      const userService = strapi.plugin('users-permissions').service('user');
      const [user] = await userService.fetchAll({ filters: { confirmationToken } });

      if (!user) {
        // let original throw the 'Invalid token' ValidationError
        return await originalEmailConfirmation(ctx, next, returnUser);
      }

      // Mark user confirmed and set account_status to active
      await userService.edit(user.id, { confirmed: true, confirmationToken: null });
      try {
        await strapi.db.connection('up_users').where('id', user.id).update({ account_status: 'active' });
      } catch (e) {
        // Non-fatal: log and continue
        strapi.log.error('[users-permissions] Failed to set account_status to active on email confirmation', e);
      }

      if (returnUser) {
        const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });
        const sanitized = await (async () => {
          const userSchema = strapi.getModel('plugin::users-permissions.user');
          return strapi.contentAPI.sanitize.output(user, userSchema, { auth: ctx.state.auth });
        })();
        ctx.send({ jwt, user: sanitized });
        return;
      }

      // default behavior: redirect to configured URL
      const settings = await strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' }).get();
      ctx.redirect(settings.email_confirmation_redirection || '/');
    } catch (err) {
      // Delegate to original to preserve error shapes
      return await originalEmailConfirmation(ctx, next, returnUser);
    }
  };

  return plugin;
};
