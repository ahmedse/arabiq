/**
 * Override users-permissions auth controller to add custom registration logic
 */

module.exports = (plugin) => {
  // Override registration
  plugin.controllers.auth.register = async (ctx) => {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const settings = await pluginStore.get({ key: 'advanced' });

    if (!settings.allow_register) {
      throw new ApplicationError('Register action is currently disabled');
    }

    const params = {
      ...ctx.request.body,
    };

    const { email, username, password, phone, country, company, salesContactAllowed, displayName } = params;

    // Validation
    if (!email) throw new ApplicationError('Please provide an email');
    if (!username) throw new ApplicationError('Please provide a username');
    if (!password) throw new ApplicationError('Please provide a password');
    if (!phone) throw new ApplicationError('Phone number is required');

    // Check if email already exists
    const existingUserByEmail = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUserByEmail) {
      throw new ApplicationError('Email is already taken');
    }

    // Check if username already exists
    const existingUserByUsername = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username },
    });

    if (existingUserByUsername) {
      throw new ApplicationError('Username is already taken');
    }

    // Check if phone already exists
    const existingUserByPhone = await strapi.query('plugin::users-permissions.user').findOne({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ApplicationError('Phone number is already registered');
    }

    // Get default role - try 'potential-customer', fallback to 'authenticated'
    let defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'potential-customer' },
    });

    if (!defaultRole) {
      defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
    }

    const userService = plugin.services.user;
    const newUser = {
      username,
      email: email.toLowerCase(),
      password,
      phone,
      country: country || null,
      company: company || null,
      salesContactAllowed: salesContactAllowed !== false,
      displayName: displayName || username,
      accountStatus: 'pending', // Requires admin approval
      provider: 'local',
      role: defaultRole.id,
      confirmed: !settings.email_confirmation,
      blocked: false,
    };

    try {
      const user = await userService.add(newUser);

      // Create audit log
      await strapi.entityService.create('api::user-audit-log.user-audit-log', {
        data: {
          user: user.id,
          action: 'register',
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.header['user-agent'],
          metadata: {
            country: country || 'unknown',
            company: company || 'none',
            salesContactAllowed,
          },
          success: true,
        },
      });

      // Send confirmation email if enabled
      if (settings.email_confirmation) {
        await userService.sendConfirmationEmail(user);
      }

      const sanitizedUser = await userService.sanitizeOutput(user, ctx);

      if (settings.email_confirmation) {
        ctx.send({
          user: sanitizedUser,
          message: 'Registration successful. Please check your email to confirm your account.',
        });
      } else {
        const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        });

        ctx.send({
          jwt,
          user: sanitizedUser,
        });
      }
    } catch (error) {
      // Log failed registration
      await strapi.entityService.create('api::user-audit-log.user-audit-log', {
        data: {
          action: 'register',
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.header['user-agent'],
          metadata: { email, username, phone },
          success: false,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  };

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
