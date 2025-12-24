import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user's subscription status
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, userId),
    });

    if (!subscription) {
      return NextResponse.json({
        hasPaidAccess: false,
        planType: "free",
        status: "inactive",
      });
    }

    // Check if user has paid access (lifetime, pro_monthly, or pro_yearly with active status)
    const hasPaidAccess =
      subscription.planType === 'lifetime' ||
      (subscription.planType === 'pro_monthly' && subscription.status === 'active') ||
      (subscription.planType === 'pro_yearly' && subscription.status === 'active');

    return NextResponse.json({
      hasPaidAccess,
      planType: subscription.planType,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
