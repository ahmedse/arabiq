const bcrypt = require('bcryptjs');

const controller = ({ strapi }) => ({
  async register(ctx) {
    const pluginStore = await strapi.store({
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings: any = await pluginStore.get({ key: 'advanced' });

    if (!settings.allow_register) {
      return ctx.badRequest('Register action is currently disabled');
    }

    const { username, email, password, phone, country, company, salesContactAllowed, displayName } = ctx.request.body;

    if (!email) return ctx.badRequest('Please provide an email');
    if (!username) return ctx.badRequest('Please provide a username');
    if (!password) return ctx.badRequest('Please provide a password');
    if (!phone) return ctx.badRequest('Phone number is required');

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return ctx.badRequest('Invalid phone number format');
    }

    const knex = strapi.db.connection;

    try {
      const existingEmail = await knex('up_users').where('email', email.toLowerCase()).first();
      if (existingEmail) return ctx.badRequest('Email is already taken');

      const existingUsername = await knex('up_users').where('username', username).first();
      if (existingUsername) return ctx.badRequest('Username is already taken');

      const existingPhone = await knex('up_users').where('phone', phone).first();
      if (existingPhone) return ctx.badRequest('Phone number is already registered');

      let defaultRole = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'potential-customer' } });
      if (!defaultRole) {
        defaultRole = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
      }

      const userService = strapi.plugin('users-permissions').service('user');

      const user = await userService.add({
        username,
        email: email.toLowerCase(),
        password,
        provider: 'local',
        role: defaultRole.id,
        confirmed: !settings.email_confirmation,
        blocked: false,
      });

      // Debug: show what we will write
      strapi.log.debug('[custom-auth] updating up_users for id', user.id, {
        phone,
        country,
        company,
        salesContactAllowed,
        displayName,
      });

      // Use RETURNING to inspect the updated row on Postgres
      const updated = await knex('up_users')
        .where('id', user.id)
        .update({
          phone: phone,
          country: country || null,
          company: company || null,
          sales_contact_allowed: salesContactAllowed !== false,
          display_name: displayName || username,
          account_status: 'pending',
        })
        .returning('*');

      strapi.log.debug('[custom-auth] knex update returned:', updated);

      const fullUser = updated && updated[0] ? updated[0] : await knex('up_users').where('id', user.id).first();

      const sanitizedUser = {
        id: fullUser.id,
        documentId: fullUser.document_id,
        username: fullUser.username,
        email: fullUser.email,
        phone: fullUser.phone,
        country: fullUser.country,
        company: fullUser.company,
        displayName: fullUser.display_name,
        accountStatus: fullUser.account_status,
        provider: fullUser.provider,
        confirmed: fullUser.confirmed,
        blocked: fullUser.blocked,
        createdAt: fullUser.created_at,
        lastLogin: fullUser.last_login || null,
        role: defaultRole,
      };

      // Log registration attempt
      try {
        await strapi.entityService.create('api::user-audit-log.user-audit-log', {
          data: {
            user: user.id,
            action: 'register',
            ipAddress: ctx.request.ip,
            userAgent: ctx.request.header['user-agent'],
            success: true,
          },
        });
      } catch (e) {
        strapi.log.error('[custom-auth] failed to create registration audit log', e);
      }

      // If email confirmation is enabled, send confirmation email and DO NOT return JWT
      if (settings.email_confirmation) {
        try {
          await userService.sendConfirmationEmail(user);

          // Audit: confirmation email sent
          try {
            await strapi.entityService.create('api::user-audit-log.user-audit-log', {
              data: {
                user: user.id,
                action: 'register',
                ipAddress: ctx.request.ip,
                userAgent: ctx.request.header['user-agent'],
                success: true,
                metadata: { emailSent: true },
              },
            });
          } catch (e) {
            strapi.log.error('[custom-auth] failed to create confirmation-sent audit log', e);
          }

          return ctx.send({ user: sanitizedUser, message: 'Confirmation email sent. Please check your inbox to activate your account.' });
        } catch (e: any) {
          strapi.log.error('[custom-auth] failed to send confirmation email', e);

          // Audit failure to send
          try {
            await strapi.entityService.create('api::user-audit-log.user-audit-log', {
              data: {
                user: user.id,
                action: 'register',
                ipAddress: ctx.request.ip,
                userAgent: ctx.request.header['user-agent'],
                success: false,
                errorMessage: e?.message || String(e),
              },
            });
          } catch (e2) {
            strapi.log.error('[custom-auth] failed to create confirmation-failure audit log', e2);
          }

          return ctx.send({ user: sanitizedUser, message: 'Account created. We were unable to send a confirmation email — please contact support.' });
        }
      }

      // No email confirmation required — issue JWT immediately
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return ctx.send({ jwt, user: sanitizedUser });
    } catch (error: any) {
      strapi.log.error('Registration error:', error);
      return ctx.badRequest(error.message || 'Registration failed');
    }
  },

  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    if (!identifier || !password) return ctx.badRequest('Identifier and password are required');

    const knex = strapi.db.connection;

    const user = await knex('up_users')
      .select(
        'id',
        'username',
        'email',
        'password',
        'display_name as displayName',
        'phone',
        'country',
        'company',
        'account_status as accountStatus',
        'sales_contact_allowed as salesContactAllowed',
        'provider',
        'confirmed',
        'blocked',
        'created_at as createdAt'
      )
      .where(function (this: any) {
        this.where('email', identifier.toLowerCase()).orWhere('username', identifier);
      })
      .first();

    if (!user) return ctx.badRequest('Invalid identifier or password');

    if (user.blocked) return ctx.badRequest('Your account has been blocked');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return ctx.badRequest('Invalid identifier or password');

    await knex('up_users').where('id', user.id).update({ last_login: new Date() });

    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

    return ctx.send({
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        company: user.company,
        country: user.country,
        accountStatus: user.accountStatus || 'pending',
        salesContactAllowed: user.salesContactAllowed === true,
        confirmed: user.confirmed,
        createdAt: user.createdAt,
      },
    });
  },

  async me(ctx: any) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const knex = strapi.db.connection;

    // Fetch full user with custom fields
    const fullUser = await knex('up_users')
      .select(
        'id',
        'document_id as documentId',
        'username',
        'email',
        'phone',
        'country',
        'company',
        'display_name as displayName',
        'account_status as accountStatus',
        'sales_contact_allowed as salesContactAllowed',
        'last_login as lastLogin',
        'provider',
        'confirmed',
        'blocked',
        'created_at as createdAt',
        'updated_at as updatedAt'
      )
      .where('id', user.id)
      .first();

    if (!fullUser) {
      return ctx.notFound('User not found');
    }

    // Return only end-user safe fields (no role metadata)
    ctx.body = {
      id: fullUser.id,
      documentId: fullUser.documentId,
      username: fullUser.username,
      email: fullUser.email,
      displayName: fullUser.displayName,
      phone: fullUser.phone,
      country: fullUser.country,
      company: fullUser.company,
      accountStatus: fullUser.accountStatus || 'pending',
      salesContactAllowed: fullUser.salesContactAllowed === true,
      lastLogin: fullUser.lastLogin || null,
      confirmed: fullUser.confirmed,
      blocked: fullUser.blocked,
      provider: fullUser.provider,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    };
  },

  async updateMe(ctx) {
    const user = ctx.state.user;

    if (!user) return ctx.unauthorized('You must be logged in');

    const { displayName, phone, country, company, salesContactAllowed } = ctx.request.body;

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phone && !phoneRegex.test(phone)) return ctx.badRequest('Invalid phone number format');

    const knex = strapi.db.connection;

    const updateData: any = {};
    if (displayName !== undefined) updateData.display_name = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (company !== undefined) updateData.company = company;
    if (salesContactAllowed !== undefined) updateData.sales_contact_allowed = salesContactAllowed;

    const updated = await knex('up_users')
      .where('id', user.id)
      .update(updateData)
      .returning('*');

    const fullUser = updated && updated[0] ? updated[0] : await knex('up_users').where('id', user.id).first();

    ctx.body = {
      id: fullUser.id,
      username: fullUser.username,
      email: fullUser.email,
      displayName: fullUser.display_name,
      phone: fullUser.phone,
      country: fullUser.country,
      company: fullUser.company,
      accountStatus: fullUser.account_status || 'pending',
      salesContactAllowed: fullUser.sales_contact_allowed === true,
      lastLogin: fullUser.last_login || null,
      confirmed: fullUser.confirmed,
      blocked: fullUser.blocked,
      createdAt: fullUser.created_at,
      updatedAt: fullUser.updated_at,
    };
  },

  async changePassword(ctx) {
    const user = ctx.state.user;

    if (!user) return ctx.unauthorized('You must be logged in');

    const { currentPassword, newPassword, newPasswordConfirmation } = ctx.request.body;

    if (!currentPassword || !newPassword || !newPasswordConfirmation) return ctx.badRequest('All password fields are required');
    if (newPassword !== newPasswordConfirmation) return ctx.badRequest('New passwords do not match');
    if (newPassword.length < 8) return ctx.badRequest('New password must be at least 8 characters');

    const knex = strapi.db.connection;

    const fullUser = await knex('up_users').where('id', user.id).first();

    if (!fullUser) return ctx.notFound('User not found');

    const valid = await bcrypt.compare(currentPassword, fullUser.password);
    if (!valid) return ctx.badRequest('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);

    await knex('up_users').where('id', user.id).update({ password: hashed });

    // Also update plugin users-permissions table if necessary
    try {
      await strapi.db.query('plugin::users-permissions.user').update({ where: { id: user.id }, data: { password: hashed } });
    } catch (e) {
      // ignore - update best-effort
    }

    ctx.body = { message: 'Password changed successfully' };
  },

});

export default controller;