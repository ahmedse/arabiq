const ADMIN_ROLE_TYPES = ['admin', 'super-admin'];
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

// Email templates for account status changes
const emailTemplates = {
  approved: (user: any) => ({
    subject: '🎉 Your Arabiq Account Has Been Approved!',
    text: `Hello ${user.display_name || user.username},

Great news! Your Arabiq account has been approved. You now have full access to our platform.

Log in to your account: ${WEB_APP_URL}/en/login

If you have any questions, please contact our support team.

Best regards,
The Arabiq Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Account Approved!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hello <strong>${user.display_name || user.username}</strong>,</p>
    <p style="font-size: 16px;">Great news! Your Arabiq account has been approved. You now have full access to our platform.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${WEB_APP_URL}/en/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Log In to Your Account</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">If you have any questions, please contact our support team.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Best regards,<br>The Arabiq Team</p>
  </div>
</body>
</html>
`,
  }),

  suspended: (user: any) => ({
    subject: 'Your Arabiq Account Has Been Suspended',
    text: `Hello ${user.display_name || user.username},

Your Arabiq account has been suspended. If you believe this was done in error or have questions, please contact our support team.

Best regards,
The Arabiq Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Account Suspended</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hello <strong>${user.display_name || user.username}</strong>,</p>
    <p style="font-size: 16px;">Your Arabiq account has been suspended. If you believe this was done in error or have questions, please contact our support team.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Best regards,<br>The Arabiq Team</p>
  </div>
</body>
</html>
`,
  }),

  roleChanged: (user: any, newRole: string) => ({
    subject: 'Your Arabiq Account Access Has Been Updated',
    text: `Hello ${user.display_name || user.username},

Your Arabiq account access level has been updated. Your new role is: ${newRole}

Log in to see your updated permissions: ${WEB_APP_URL}/en/login

Best regards,
The Arabiq Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Access Updated</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hello <strong>${user.display_name || user.username}</strong>,</p>
    <p style="font-size: 16px;">Your Arabiq account access level has been updated.</p>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">New Role</p>
      <p style="margin: 5px 0 0; font-size: 18px; font-weight: 600; color: #3b82f6;">${newRole}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${WEB_APP_URL}/en/login" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Log In to See Your Permissions</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Best regards,<br>The Arabiq Team</p>
  </div>
</body>
</html>
`,
  }),
};

export default ({ strapi }) => ({
  /**
   * Get all users (admin only)
   */
  async getUsers(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const knex = strapi.db.connection;

    // Check if user is admin
    const userWithRole = await knex('up_users')
      .join('up_users_role_lnk', 'up_users.id', 'up_users_role_lnk.user_id')
      .join('up_roles', 'up_users_role_lnk.role_id', 'up_roles.id')
      .select('up_roles.type as roleType')
      .where('up_users.id', user.id)
      .first();

    if (!userWithRole || !ADMIN_ROLE_TYPES.includes(userWithRole.roleType)) {
      return ctx.forbidden('Admin access required');
    }

    // Get all users with their roles
    const users = await knex('up_users')
      .leftJoin('up_users_role_lnk', 'up_users.id', 'up_users_role_lnk.user_id')
      .leftJoin('up_roles', 'up_users_role_lnk.role_id', 'up_roles.id')
      .select(
        'up_users.id',
        'up_users.username',
        'up_users.email',
        'up_users.phone',
        'up_users.company',
        'up_users.country',
        'up_users.display_name as displayName',
        'up_users.account_status as accountStatus',
        'up_users.confirmed',
        'up_users.blocked',
        'up_users.created_at as createdAt',
        'up_users.last_login as lastLogin',
        'up_roles.id as roleId',
        'up_roles.name as roleName',
        'up_roles.type as roleType'
      )
      .orderBy('up_users.created_at', 'desc');

    const formattedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      company: u.company,
      country: u.country,
      displayName: u.displayName,
      accountStatus: u.accountStatus || 'pending',
      confirmed: u.confirmed,
      blocked: u.blocked,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      role: u.roleId ? { id: u.roleId, name: u.roleName, type: u.roleType } : null,
    }));

    ctx.body = { data: formattedUsers };
  },

  /**
   * Update user account status (admin only)
   */
  async updateStatus(ctx) {
    const adminUser = ctx.state.user;
    if (!adminUser) return ctx.unauthorized('You must be logged in');

    const { userId, status } = ctx.request.body;
    if (!userId || !status) return ctx.badRequest('userId and status are required');
    if (!['pending', 'active', 'suspended'].includes(status)) {
      return ctx.badRequest('Invalid status. Must be pending, active, or suspended');
    }

    const knex = strapi.db.connection;

    // Check admin permissions
    const adminWithRole = await knex('up_users')
      .join('up_users_role_lnk', 'up_users.id', 'up_users_role_lnk.user_id')
      .join('up_roles', 'up_users_role_lnk.role_id', 'up_roles.id')
      .select('up_roles.type as roleType')
      .where('up_users.id', adminUser.id)
      .first();

    if (!adminWithRole || !ADMIN_ROLE_TYPES.includes(adminWithRole.roleType)) {
      return ctx.forbidden('Admin access required');
    }

    // Get the user to update
    const targetUser = await knex('up_users').where('id', userId).first();
    if (!targetUser) return ctx.notFound('User not found');

    const previousStatus = targetUser.account_status;

    // Update user status
    await knex('up_users').where('id', userId).update({ account_status: status });

    // Audit log
    try {
      await strapi.entityService.create('api::user-audit-log.user-audit-log', {
        data: {
          user: userId,
          action: `status-changed-${status}`,
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.header['user-agent'],
          success: true,
          metadata: { previousStatus, newStatus: status, changedBy: adminUser.id },
        },
      });
    } catch (e) {
      strapi.log.error('[user-management] failed to create audit log', e);
    }

    // Send notification email
    if (status !== previousStatus) {
      try {
        let emailContent = null;
        if (status === 'active') {
          emailContent = emailTemplates.approved(targetUser);
        } else if (status === 'suspended') {
          emailContent = emailTemplates.suspended(targetUser);
        }

        if (emailContent) {
          await strapi.plugins.email.services.email.send({
            to: targetUser.email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          });
          strapi.log.info(`[user-management] Status change email sent to ${targetUser.email}`);
        }
      } catch (e) {
        strapi.log.error('[user-management] Failed to send status change email', e);
      }
    }

    ctx.body = { success: true, message: `User status updated to ${status}` };
  },

  /**
   * Elevate user role (admin only)
   */
  async elevateRole(ctx) {
    const adminUser = ctx.state.user;
    if (!adminUser) return ctx.unauthorized('You must be logged in');

    const { userId, roleId, reason } = ctx.request.body;
    if (!userId || !roleId) return ctx.badRequest('userId and roleId are required');

    const knex = strapi.db.connection;

    // Check admin permissions
    const adminWithRole = await knex('up_users')
      .join('up_users_role_lnk', 'up_users.id', 'up_users_role_lnk.user_id')
      .join('up_roles', 'up_users_role_lnk.role_id', 'up_roles.id')
      .select('up_roles.type as roleType')
      .where('up_users.id', adminUser.id)
      .first();

    if (!adminWithRole || !ADMIN_ROLE_TYPES.includes(adminWithRole.roleType)) {
      return ctx.forbidden('Admin access required');
    }

    // Get the target user and their current role
    const targetUser = await knex('up_users').where('id', userId).first();
    if (!targetUser) return ctx.notFound('User not found');

    const currentRoleLink = await knex('up_users_role_lnk')
      .join('up_roles', 'up_users_role_lnk.role_id', 'up_roles.id')
      .select('up_roles.id as roleId', 'up_roles.name as roleName')
      .where('up_users_role_lnk.user_id', userId)
      .first();

    // Get the new role
    const newRole = await knex('up_roles').where('id', roleId).first();
    if (!newRole) return ctx.badRequest('Invalid role ID');

    // Update role link (delete old, insert new)
    await knex('up_users_role_lnk').where('user_id', userId).delete();
    await knex('up_users_role_lnk').insert({ user_id: userId, role_id: roleId });

    // Audit log
    try {
      await strapi.entityService.create('api::user-audit-log.user-audit-log', {
        data: {
          user: userId,
          action: 'role-changed',
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.header['user-agent'],
          success: true,
          metadata: {
            previousRole: currentRoleLink?.roleName || 'none',
            newRole: newRole.name,
            reason: reason || 'Admin role change',
            changedBy: adminUser.id,
          },
        },
      });
    } catch (e) {
      strapi.log.error('[user-management] failed to create audit log', e);
    }

    // Send notification email
    if (currentRoleLink?.roleId !== roleId) {
      try {
        const emailContent = emailTemplates.roleChanged(targetUser, newRole.name);
        await strapi.plugins.email.services.email.send({
          to: targetUser.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
        strapi.log.info(`[user-management] Role change email sent to ${targetUser.email}`);
      } catch (e) {
        strapi.log.error('[user-management] Failed to send role change email', e);
      }
    }

    ctx.body = { success: true, message: `User role updated to ${newRole.name}` };
  },
});
