import type { ReactNode } from "react";
import { requireApproved } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireApproved();

  // Marque l'utilisateur comme "en ligne" (throttlé : au plus 1 écriture / min).
  const lastSeen = user.lastSeenAt?.getTime() ?? 0;
  if (Date.now() - lastSeen > 60_000) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });
  }

  const [unreadNotifications, unreadMessages] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.privateMessage.count({
      where: { recipientId: user.id, read: false },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <NavBar
        firstName={user.firstName}
        isAdmin={isStaff(user.role)}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
