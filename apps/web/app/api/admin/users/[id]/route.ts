import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { userHasRole } from '@/lib/roles';
import { logAuditEvent } from '@/lib/audit';

export async function PATCH(request: Request, context: any) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const params = await context.params;
  const targetUserId = params.id;
  const body = await request.json().catch(() => ({}));

  const updates: any = {};
  if (typeof body.disabled === 'boolean') updates.disabled = body.disabled;
  if (typeof body.approvalStatus === 'string') updates.approvalStatus = body.approvalStatus;

  const actorId = session.user.id;
  const ip = request.headers.get('x-forwarded-for') || null;
  const userAgent = request.headers.get('user-agent') || null;

  // Apply changes
  try {
    // Handle approval status separately (UserApproval model)
    if (updates.approvalStatus) {
      const status = updates.approvalStatus;
      await prisma.userApproval.upsert({
        where: { userId: targetUserId },
        update: { status },
        create: { userId: targetUserId, status },
      });

      await logAuditEvent({ actorId, action: `set-approval-${status}`, targetUserId, reason: body.reason ?? null, ip, userAgent });

      // If rejected, revoke sessions
      if (status === 'REJECTED') {
        await prisma.session.deleteMany({ where: { userId: targetUserId } });
      }
    }

    // Disabled toggle
    if (typeof updates.disabled === 'boolean') {
      await prisma.user.update({ where: { id: targetUserId }, data: { disabled: updates.disabled } });
      await logAuditEvent({ actorId, action: updates.disabled ? 'disable-user' : 'enable-user', targetUserId, reason: body.reason ?? null, ip, userAgent });

      if (updates.disabled) {
        await prisma.session.deleteMany({ where: { userId: targetUserId } });
      }
    }

    // Roles assignment (replace existing roles if roles array provided)
    if (Array.isArray(body.roles)) {
      // Resolve role ids
      const roleNames: string[] = body.roles.map(String);
      const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });

      // Remove existing userRoles not in the new set, and add the ones missing
      await prisma.userRole.deleteMany({ where: { userId: targetUserId } });

      for (const r of roles) {
        await prisma.userRole.create({ data: { userId: targetUserId, roleId: r.id } });
      }

      await logAuditEvent({ actorId, action: `set-roles`, targetUserId, meta: { roles: roleNames }, ip, userAgent });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin/users/[id] PATCH error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const params = await context.params;
  const targetUserId = params.id;
  const actorId = session.user.id;
  const ip = request.headers.get('x-forwarded-for') || null;
  const userAgent = request.headers.get('user-agent') || null;

  try {
    // Revoke sessions
    await prisma.session.deleteMany({ where: { userId: targetUserId } });

    // Soft-delete pattern: mark disabled and remove roles/approval
    await prisma.userRole.deleteMany({ where: { userId: targetUserId } });
    await prisma.userApproval.deleteMany({ where: { userId: targetUserId } });
    await prisma.user.update({ where: { id: targetUserId }, data: { disabled: true } });

    await logAuditEvent({ actorId, action: 'delete-user', targetUserId, reason: null, ip, userAgent });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin/users/[id] DELETE error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
