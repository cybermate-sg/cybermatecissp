import dynamic from "next/dynamic";
import { CTAButtons } from "@/components/CTAButtons";
import { hasPaidAccess } from "@/lib/subscription";

const BuyNowButton = dynamic(() => import("@/components/BuyNowButton"), {
    loading: () => (
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-10 py-5 rounded-full animate-pulse h-16 w-80" />
    ),
    ssr: true,
});

export async function FinalCTAButtons() {
    const hasPaidPlan = await hasPaidAccess();

    return (
        <CTAButtons
            isSignedIn={hasPaidPlan}
            containerClassName="flex flex-col sm:flex-row gap-6 items-center justify-center"
            buyNowButton={
                <BuyNowButton
                    priceId={process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID!}
                    text="Unlock the Course – $197 (Special Launch Rate)"
                    className="!bg-gradient-to-r !from-purple-600 !via-purple-500 !to-purple-600 hover:!from-purple-500 hover:!via-purple-400 hover:!to-purple-500 !text-white !font-bold !px-10 !py-5 !text-lg !shadow-2xl !shadow-purple-500/30 hover:!shadow-purple-500/50 !transform hover:!scale-105"
                    disabled={false}
                />
            }
        />
    );
}
