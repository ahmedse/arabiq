/**
 * Demo access policy - simplified: uses only accessLevel (public/authenticated)
 */

export default async (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  const { id } = policyContext.params;

  // admin bypass
  if (user && user.role && user.role.type === 'admin') return true;

  try {
    const demo = await strapi.entityService.findOne('api::demo.demo', id, { populate: [] });
    if (!demo) return false;

    if (demo.accessLevel === 'public') return true;
    if (demo.accessLevel === 'authenticated') return Boolean(user);

    // default allow
    return Boolean(user);
  } catch (err) {
    strapi.log.error('Demo access policy error:', err);
    return false;
  }
};
