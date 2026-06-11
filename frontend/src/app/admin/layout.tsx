import { Sidebar, MobileAdminNav } from "@/components/admin/sidebar";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <MobileAdminNav />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
