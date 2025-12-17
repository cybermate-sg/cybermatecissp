import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, withRetry } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "./_components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const userResult = await withRetry(
    () => db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1),
    {
      maxRetries: 3,
      delayMs: 500,
      queryName: 'admin-layout-user-check',
    }
  );

  const user = userResult[0];

  if (!user || user.role !== 'admin') {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
