/**
 * Audit logging middleware - logs user actions to audit log
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();
    
    await next();
    
    const user = ctx.state.user;
    const duration = Date.now() - start;
    const routePath = ctx.request.path;
    const method = ctx.request.method;

    // Only log authenticated requests to specific routes
    if (!user) return;

    // Skip logging for certain routes
    const skipPaths = [
      '/api/user-audit-logs',
      '/api/upload',
      '/_health',
      '/admin',
    ];

    const shouldSkip = skipPaths.some(path => routePath.startsWith(path));
    if (shouldSkip) return;

    // Determine action based on route
    let action = null;
    let targetDemo = null;
    let metadata: any = {
      method,
      path: routePath,
      statusCode: ctx.response.status,
      duration,
    };

    // Demo access tracking
    if (routePath.includes('/api/demos/') && method === 'GET') {
      action = ctx.response.status === 200 ? 'demo_access' : 'demo_access_denied';
      
      // Extract demo ID from path
      const demoIdMatch = routePath.match(/\/api\/demos\/(\d+)/);
      if (demoIdMatch) {
        targetDemo = parseInt(demoIdMatch[1]);
      }
    }

    // Profile updates
    if (routePath.includes('/api/users/me') && method === 'PUT') {
      action = 'profile_update';
      metadata.updatedFields = Object.keys(ctx.request.body);
    }

    // Password reset
    if (routePath.includes('/api/auth/forgot-password')) {
      action = 'password_reset_request';
    }

    if (routePath.includes('/api/auth/reset-password')) {
      action = 'password_reset';
    }

    // Only create audit log if we identified an action
    if (action) {
      try {
        await strapi.entityService.create('api::user-audit-log.user-audit-log', {
          data: {
            user: user.id,
            action,
            ipAddress: ctx.request.ip,
            userAgent: ctx.request.header['user-agent'] || 'unknown',
            targetDemo,
            metadata,
            success: ctx.response.status < 400,
            errorMessage: ctx.response.status >= 400 ? ctx.response.message : null,
          },
        });
      } catch (error) {
        // Don't fail the request if audit logging fails
        strapi.log.error('Failed to create audit log:', error);
      }
    }
  };
};
