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

      await knex('up_users').where('id', user.id).update({
        phone: phone,
        country: country || null,
        company: company || null,
        sales_contact_allowed: salesContactAllowed !== false,
        display_name: displayName || username,
        account_status: 'pending',
      });

      const fullUser = await knex('up_users').where('id', user.id).first();

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
        role: defaultRole,
      };

      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return ctx.send({ jwt, user: sanitizedUser });
    } catch (error: any) {
      strapi.log.error('Registration error:', error);
      return ctx.badRequest(error.message || 'Registration failed');
    }
  },
});

export default controller;