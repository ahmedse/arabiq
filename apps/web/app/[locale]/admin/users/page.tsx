import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/roles";
import { logAuditEvent } from "@/lib/audit";

type AdminUsersPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isApprovalStatus(value: string): value is ApprovalStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

async function updateApprovalAction(formData: FormData) {
  "use server";

  const session = await auth();
  const userEmail = session?.user?.email?.toLowerCase();
  const adminEmails = getAdminEmails();

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const statusRaw = String(formData.get("status") ?? "PENDING");
  const locale = String(formData.get("locale") ?? "en");

  if (!isApprovalStatus(statusRaw)) {
    return;
  }

  if (!userId) {
    return;
  }

  await prisma.userApproval.upsert({
    where: { userId },
    update: { status: statusRaw },
    create: { userId, status: statusRaw },
  });

  // If rejected, revoke sessions and log
  if (statusRaw === 'REJECTED') {
    await prisma.session.deleteMany({ where: { userId } });
    await logAuditEvent({ actorId: session?.user?.id ?? null, action: 'reject-user', targetUserId: userId });
  } else if (statusRaw === 'APPROVED') {
    await logAuditEvent({ actorId: session?.user?.id ?? null, action: 'approve-user', targetUserId: userId });
  }

  revalidatePath(`/${locale}/admin/users`);
}

async function updateRolesAction(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user?.id) return;

  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return;

  const userId = String(formData.get("userId") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  if (!userId) return;

  const roles = formData.getAll('roles').map(String).filter(Boolean);

  // Resolve role ids and replace user roles
  const roleRows = await prisma.role.findMany({ where: { name: { in: roles } } });

  await prisma.userRole.deleteMany({ where: { userId } });
  for (const r of roleRows) {
    await prisma.userRole.create({ data: { userId, roleId: r.id } });
  }

  await logAuditEvent({ actorId: session.user.id, action: 'set-roles', targetUserId: userId, meta: { roles } });

  revalidatePath(`/${locale}/admin/users`);
}

export default async function AdminUsersPage({ params }: AdminUsersPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      approval: {
        select: {
          status: true,
          createdAt: true,
        },
      },
      userRoles: {
        select: {
          role: { select: { name: true } },
        },
      },
    },
    orderBy: {
      approval: { createdAt: "desc" },
    },
    take: 200,
  });

  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });

  const pending = users.filter((user) => (user.approval?.status ?? "PENDING") === "PENDING");
  const reviewed = users.filter((user) => (user.approval?.status ?? "PENDING") !== "PENDING");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">User Approvals</h1>
        <p className="text-sm text-slate-500">Manage access approvals and roles for demo users.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pending</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">No pending approvals.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((user) => (
                  <tr key={user.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-900">{user.email ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.approval?.createdAt ? user.approval.createdAt.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">PENDING</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <form action={updateApprovalAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <input type="hidden" name="locale" value={locale} />
                          <button className="rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700">
                            Approve
                          </button>
                        </form>
                        <form action={updateApprovalAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <input type="hidden" name="locale" value={locale} />
                          <button className="rounded border border-rose-600 px-3 py-1 text-rose-600 hover:bg-rose-50">
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Reviewed</h2>
        {reviewed.length === 0 ? (
          <p className="text-sm text-slate-500">No reviewed approvals.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewed.map((user) => (
                  <tr key={user.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-900">{user.email ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.approval?.createdAt ? user.approval.createdAt.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.approval?.status ?? "PENDING"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {/* Roles form below */}
                      <form action={updateRolesAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select name="roles" multiple defaultValue={user.userRoles?.map((ur) => ur.role.name) ?? []} className="rounded border px-2 py-1 text-sm">
                          {roles.map((r) => (
                            <option key={r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <input type="hidden" name="locale" value={locale} />
                        <button className="rounded border border-slate-600 px-3 py-1 text-slate-600 hover:bg-slate-50">Save</button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <form action={updateApprovalAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <input type="hidden" name="locale" value={locale} />
                          <button className="rounded border border-emerald-600 px-3 py-1 text-emerald-600 hover:bg-emerald-50">
                            Approve
                          </button>
                        </form>
                        <form action={updateApprovalAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <input type="hidden" name="locale" value={locale} />
                          <button className="rounded border border-rose-600 px-3 py-1 text-rose-600 hover:bg-rose-50">
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
