import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validatePriceId(priceId: string | undefined): NextResponse | null {
  if (!priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  }
  return null;
}

export async function POST(req: Request) {
  try {
    console.log("Checkout API called - route hit!");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const { userId } = await auth();
    const user = await currentUser();

    // Require authentication
    if (!userId || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { priceId } = body;

    console.log("Price ID:", priceId);
    console.log("User ID:", userId);

    const priceValidationError = validatePriceId(priceId);
    if (priceValidationError) return priceValidationError;

    // Check if user already has paid access (server-side check)
    const { db } = await import("@/lib/db");
    const { subscriptions } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, userId),
    });

    if (subscription) {
      const hasPaidAccess =
        subscription.planType === 'lifetime' ||
        (subscription.planType === 'pro_monthly' && subscription.status === 'active') ||
        (subscription.planType === 'pro_yearly' && subscription.status === 'active');

      if (hasPaidAccess) {
        console.log("⚠️ User already has paid access, blocking checkout");
        return NextResponse.json(
          {
            error: "You already have an active subscription. No need to purchase again.",
            redirectTo: "/dashboard?message=already_subscribed"
          },
          { status: 400 }
        );
      }
    }

    const customerEmail = user.emailAddresses[0]?.emailAddress;
    const customerName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.lastName || undefined;

    if (!customerEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    console.log("Customer Email:", customerEmail);

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      client_reference_id: userId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      metadata: {
        userId: userId,
        userEmail: customerEmail,
        userName: customerName || customerEmail,
      },
      payment_intent_data: {
        metadata: {
          clerkUserId: userId,
          userEmail: customerEmail,
          userName: customerName || customerEmail,
          priceId: priceId,
        },
      },
    });

    console.log("✅ Checkout session created:", session.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
