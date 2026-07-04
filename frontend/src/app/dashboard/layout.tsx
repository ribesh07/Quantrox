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
    <div className="min-h-screen bg-muted/30">
      {/* Fixed Desktop Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="flex min-h-screen flex-col md:ml-64">
        {/* Mobile Navigation */}
        <MobileUserNav />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* Notification Client */}
        {(session.user as any)?.id && (
          <NotificationClient userId={(session.user as any).id} />
        )}
      </div>
    </div>
  );
}