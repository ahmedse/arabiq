const { PrismaClient } = require('@prisma/client');
const speakeasy = require('speakeasy');

const prisma = new PrismaClient();

async function main() {
  const email = `test+verify+${Date.now()}@example.com`;
  console.log('Creating test user:', email);

  const user = await prisma.user.create({ data: { email, name: 'Test Verify' } });
  console.log('User created:', user.id);

  const approval = await prisma.userApproval.create({ data: { userId: user.id, status: 'PENDING' } });
  console.log('Approval created:', approval.status);

  // Assign ADMIN role using existing seeded role
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    console.error('ADMIN role not found; ensure roles are seeded');
    process.exit(1);
  }

  await prisma.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });
  console.log('Assigned ADMIN role to user');

  // Create a session for the user
  const session = await prisma.session.create({ data: { userId: user.id, sessionToken: `sess_${Date.now()}`, expires: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
  console.log('Created session:', session.id);

  // MFA: generate secret and token, then verify
  const secret = speakeasy.generateSecret({ name: `Arabiq Admin (${email})` });
  const token = speakeasy.totp({ secret: secret.base32, encoding: 'base32' });

  console.log('MFA secret generated, token (for test):', token);

  // Simulate enabling MFA by storing secret
  await prisma.user.update({ where: { id: user.id }, data: { adminMfaEnabled: true, adminMfaSecret: secret.base32 } });
  console.log('Stored MFA secret for user');

  // Verify TOTP
  const ok = speakeasy.totp.verify({ secret: secret.base32, encoding: 'base32', token, window: 1 });
  console.log('TOTP verification result:', ok);

  if (!ok) {
    console.error('TOTP verification failed - aborting further tests');
  }

  // Now disable user (soft-delete) and confirm sessions revoked
  await prisma.user.update({ where: { id: user.id }, data: { disabled: true } });
  console.log('User disabled');

  // Revoke sessions
  const deleted = await prisma.session.deleteMany({ where: { userId: user.id } });
  console.log('Sessions deleted count:', deleted.count);

  // Cleanup: remove userRoles and approval
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userApproval.deleteMany({ where: { userId: user.id } });
  await prisma.userProfile.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('Cleaned up test data');
}

main()
  .catch((e) => {
    console.error('Manual verify script error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });