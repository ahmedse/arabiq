/**
 * Strapi bootstrap script to create custom roles
 * This should be added to the bootstrap function in src/index.ts
 */

export async function createCustomRoles(strapi: any) {
  const customRoles = [
    {
      name: 'Potential Customer',
      description: 'New users awaiting approval, limited access to public content',
      type: 'potential-customer',
    },
    {
      name: 'Client',
      description: 'Approved clients with access to premium demos and content',
      type: 'client',
    },
    {
      name: 'Premium',
      description: 'Premium tier clients with full access to all demos',
      type: 'premium',
    },
  ];

  for (const roleData of customRoles) {
    // Check if role already exists
    const existingRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: roleData.type },
    });

    if (!existingRole) {
      await strapi.query('plugin::users-permissions.role').create({
        data: roleData,
      });
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      console.log(`ℹ️  Role already exists: ${roleData.name}`);
    }
  }
}
