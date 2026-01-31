export default (plugin) => {
  // Extend user content-type with custom attributes
  plugin.contentTypes.user.schema.attributes = {
    ...plugin.contentTypes.user.schema.attributes,
    displayName: {
      type: 'string',
    },
    phone: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
    company: {
      type: 'string',
    },
    accountStatus: {
      type: 'enumeration',
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
    salesContactAllowed: {
      type: 'boolean',
      default: true,
    },
    confirmationTokenExpiresAt: {
      type: 'datetime',
    },
    lastLogin: {
      type: 'datetime',
    },
  };

  // Wrap sendConfirmationEmail to set an expiry on the confirmation token (configurable via CONFIRMATION_TOKEN_LIFESPAN_HOURS)
  try {
    const originalSend = plugin.services?.user?.sendConfirmationEmail?.bind(plugin.services.user);

    // Ensure services object exists
    plugin.services = plugin.services || {};
    plugin.services.user = plugin.services.user || plugin.service('user');

    plugin.services.user.sendConfirmationEmail = async (user) => {
      const hours = parseInt(process.env.CONFIRMATION_TOKEN_LIFESPAN_HOURS || '24', 10);
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

      if (typeof originalSend === 'function') {
        // Call original to generate token and send the email
        await originalSend(user);

        // Store expiry alongside the generated token
        try {
          await strapi.plugin('users-permissions').service('user').edit(user.id, {
            confirmationTokenExpiresAt: expiresAt,
          });
        } catch (e) {
          strapi.log.error('[users-permissions] Failed to set confirmation token expiry', e);
        }
      } else {
        // Fallback: generate token and set expiry, then attempt to trigger send
        const crypto = require('crypto');
        const confirmationToken = crypto.randomBytes(20).toString('hex');
        try {
          await strapi.plugin('users-permissions').service('user').edit(user.id, {
            confirmationToken,
            confirmationTokenExpiresAt: expiresAt,
          });
        } catch (e) {
          strapi.log.error('[users-permissions] failed to set token/expiry in fallback', e);
        }

        // If original send exists on strapi service, try to use it
        const sendFunc = strapi.plugin('users-permissions').service('user').sendConfirmationEmail;
        if (typeof sendFunc === 'function' && sendFunc !== plugin.services.user.sendConfirmationEmail) {
          try { await sendFunc(user); } catch (e) { strapi.log.error('[users-permissions] fallback send failed', e); }
        }
      }
    };
  } catch (e) {
    strapi.log.error('[users-permissions] Could not wrap sendConfirmationEmail', e);
  }

  return plugin;
};