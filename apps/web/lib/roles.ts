import { prisma } from "@/lib/prisma";

export async function getUserRoleNames(userId: string) {
  const userRoles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } });
  return userRoles.map((ur) => ur.role.name);
}

export async function userHasRole(userId: string, roleName: string) {
  const ur = await prisma.userRole.findFirst({ where: { userId, role: { name: roleName } }, include: { role: true } });
  return !!ur;
}

export async function userHasAnyRole(userId: string, roleNames: string[]) {
  if (!roleNames || roleNames.length === 0) return false;
  const ur = await prisma.userRole.findFirst({ where: { userId, role: { name: { in: roleNames } } }, include: { role: true } });
  return !!ur;
}