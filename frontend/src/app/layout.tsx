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
      <UserSidebar />

      <div className="flex min-h-screen flex-col md:ml-64">
        <MobileUserNav />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {(session.user as any)?.id && (
          <NotificationClient userId={(session.user as any).id} />
        )}
      </div>
    </div>
  );
}