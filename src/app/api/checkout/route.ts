import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isValidEmail } from "@/lib/middleware/request-validation";

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

function validateEmail(customerEmail: string | undefined, isGuest: boolean, email?: string): NextResponse | null {
  if (!customerEmail) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  if (isGuest && email && !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
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
    const body = await req.json();
    const { priceId, email } = body;

    console.log("Price ID:", priceId);
    console.log("User ID:", userId);
    console.log("Email:", email);

    const priceValidationError = validatePriceId(priceId);
    if (priceValidationError) return priceValidationError;

    const customerEmail = user?.emailAddresses[0]?.emailAddress || email;
    const emailValidationError = validateEmail(customerEmail, !user, email);
    if (emailValidationError) return emailValidationError;

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      client_reference_id: userId || undefined,
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
        userId: userId || "guest",
        userEmail: customerEmail,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
