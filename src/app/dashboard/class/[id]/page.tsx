import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getClassWithProgress } from "@/lib/api/class-server";
import ClassDetailClient from "@/components/ClassDetailClient";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { db, withRetry } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const classData = await getClassWithProgress(id);

  if (!classData) {
    return {
      title: "Class Not Found | CISSP Mastery",
    };
  }

  return {
    title: `${classData.name} | CISSP Mastery`,
    description: classData.description || `Study ${classData.name} with confidence-based flashcards`,
  };
}

// Server Component - Pre-renders HTML with data
export default async function ClassDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Get authentication
  const { userId } = await auth();
  const user = await currentUser();

  // Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Unwrap params
  const { id: classId } = await params;

  // Fetch class data server-side (with Redis caching)
  const classData = await getClassWithProgress(classId);

  // Redirect to dashboard if class not found
  if (!classData) {
    redirect("/dashboard");
  }

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === "admin";

  // Fetch user subscription to calculate remaining days
  let daysLeft: number | null = null;

  try {
    // First, check ALL subscriptions for this user (for debugging)
    const allUserSubscriptions = await withRetry(
      () => db.query.subscriptions.findMany({
        where: eq(subscriptions.clerkUserId, userId),
        orderBy: [desc(subscriptions.createdAt)]
      }),
      { queryName: 'fetch-all-user-subscriptions' }
    );

    console.log(`[Subscription Debug] User ID: ${userId}`);
    console.log(`[Subscription Debug] Total subscriptions found: ${allUserSubscriptions.length}`);
    if (allUserSubscriptions.length > 0) {
      allUserSubscriptions.forEach((sub, index) => {
        console.log(`[Subscription Debug] Sub ${index + 1}: Status='${sub.status}', CreatedAt='${sub.createdAt}', ID='${sub.id}'`);
      });
    }

    // Now get the active one
    const subscription = await withRetry(
      () => db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.clerkUserId, userId),
          eq(subscriptions.status, 'active')
        ),
        orderBy: [desc(subscriptions.createdAt)]
      }),
      { queryName: 'fetch-active-subscription' }
    );

    // Calculate remaining days from subscription creation date (365 days total)
    if (subscription?.createdAt) {
      const startDate = new Date(subscription.createdAt);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      daysLeft = Math.max(0, 365 - daysSinceStart);

      // Debug logging to verify calculation
      console.log(`[Days Calculation] Start: ${startDate.toISOString()}, Today: ${today.toISOString()}, Days Since Start: ${daysSinceStart}, Days Left: ${daysLeft}`);
    } else {
      console.log('[Days Calculation] No active subscription found');
    }
  } catch (error) {
    console.error('[Subscription Error] Failed to fetch subscription:', error);
    // Continue without subscription info - page will still work
    daysLeft = null;
  }

  // Get user's first name
  const userName = user?.firstName || user?.username || "there";

  return (
    <div className="min-h-screen bg-white">
      {/* Performance Monitoring */}
      <PerformanceMonitor pageName="Class Detail Page (SSR)" showVisual={false} />

      {/* Header with Back Button */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Client Component with Interactive Features */}
      <ClassDetailClient
        classData={classData}
        isAdmin={isAdmin}
        userName={userName}
        daysLeft={daysLeft}
      />
    </div>
  );
}
