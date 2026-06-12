import { UserSidebar, MobileUserNav } from "@/components/user/sidebar";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import NotificationClient from "@/components/notification-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <UserSidebar />
      <div className="flex flex-col flex-1">
        <MobileUserNav />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">{children}</main>
        {/* Notification client initialized with session user id */}
        {(session.user as any)?.id && <NotificationClient userId={(session.user as any).id} />}
      </div>
    </div>
  );
}
