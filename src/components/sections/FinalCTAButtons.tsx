import { auth } from "@clerk/nextjs/server";
import dynamic from "next/dynamic";
import { CTAButtons } from "@/components/CTAButtons";

type HasPlanFn = ((params: { plan: string }) => boolean) | undefined;

function hasPaidPlanForUser(has: HasPlanFn) {
    if (!has) {
        return false;
    }

    return has({ plan: "paid" });
}

const BuyNowButton = dynamic(() => import("@/components/BuyNowButton"), {
    loading: () => (
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-10 py-5 rounded-full animate-pulse h-16 w-80" />
    ),
    ssr: true,
});

export async function FinalCTAButtons() {
    const { has } = await auth();
    const hasPaidPlan = hasPaidPlanForUser(has);

    return (
        <CTAButtons
            isSignedIn={hasPaidPlan}
            containerClassName="flex flex-col sm:flex-row gap-6 items-center justify-center"
            buyNowButton={
                <BuyNowButton
                    priceId={process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID!}
                    text="Unlock the Course – $97 (Special Launch Rate)"
                    className="!bg-gradient-to-r !from-purple-600 !via-purple-500 !to-purple-600 hover:!from-purple-500 hover:!via-purple-400 hover:!to-purple-500 !text-white !font-bold !px-10 !py-5 !text-lg !shadow-2xl !shadow-purple-500/30 hover:!shadow-purple-500/50 !transform hover:!scale-105"
                    disabled={true}
                />
            }
        />
    );
}
