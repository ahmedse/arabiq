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
        role: defaultRole,
      };

      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return ctx.send({ jwt, user: sanitizedUser });
    } catch (error: any) {
      strapi.log.error('Registration error:', error);
      return ctx.badRequest(error.message || 'Registration failed');
    }
  },

  async me(ctx: any) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const knex = strapi.db.connection;

    // Fetch full user
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

    // Get role
    const roleLink = await knex('up_users_role_lnk')
      .where('user_id', user.id)
      .first();

    let role = null;
    if (roleLink) {
      role = await knex('up_roles')
        .select('id', 'document_id as documentId', 'name', 'description', 'type')
        .where('id', roleLink.role_id)
        .first();
    }

    ctx.body = {
      ...fullUser,
      role,
    };
  },
  
});

export default controller;