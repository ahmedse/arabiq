import { prisma } from "@/lib/prisma";

export async function logAuditEvent(params: {
  actorId?: string | null;
  action: string;
  targetUserId?: string | null;
  reason?: string | null;
  meta?: any;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const ev = await prisma.auditEvent.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      targetUserId: params.targetUserId ?? null,
      reason: params.reason ?? null,
      meta: params.meta ?? null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
  return ev;
}
