"use client";

import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Image from "next/image";
import { Sparkles, Shield } from "lucide-react";
import { CTAButtons } from "@/components/CTAButtons";

const BuyNowButton = dynamic(() => import("@/components/BuyNowButton"), {
    loading: () => (
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-10 py-5 rounded-full animate-pulse h-16 w-80" />
    ),
    ssr: false,
});

function HeroCTAButtons({ centered = false }: { centered?: boolean }) {
    const { isSignedIn } = useAuth();

    const containerClassName = `flex flex-col sm:flex-row gap-6 items-center ${centered ? "justify-center" : "justify-center lg:justify-start"}`;

    return (
        <CTAButtons
            isSignedIn={!!isSignedIn}
            containerClassName={containerClassName}
            buyNowButton={
                <BuyNowButton
                    priceId={process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID!}
                    text="Unlock the Course – $100 (Special Launch Rate)"
                    className="!bg-gradient-to-r !from-purple-600 !via-purple-500 !to-purple-600 hover:!from-purple-500 hover:!via-purple-400 hover:!to-purple-500 !text-white !font-bold !px-10 !py-5 !text-lg !shadow-2xl !shadow-purple-500/30 hover:!shadow-purple-500/50 !transform hover:!scale-105"
                />
            }
        />
    );
}

function CTAPlaceholder() {
    return (
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center lg:justify-start">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-10 py-5 rounded-full animate-pulse h-16 w-80" />
        </div>
    );
}

export default function HeroSection() {
    return (
        <section className="relative pt-20 lg:pt-32 pb-20 lg:pb-28 overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8 text-center lg:text-left">
                            {/* Trust badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm">
                                <Shield className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm font-semibold text-cyan-400">98.2% First-Time Pass Rate</span>
                                <Sparkles className="w-4 h-4 text-purple-400" />
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                                Battle-Tested.
                                <br />
                                <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                                   Hand-Curated.
                                </span>
                                <br />
                                First-Attempt Proven.
                            </h1>

                            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                I turned my own handwritten notes + official CBK references into the exact system that helped students pass CISSP on the first attempt. Straight to the point. No fluff. Only what you need to succeed.
                            </p>

                            {/* Social proof counters */}
                            <div className="flex flex-wrap gap-8 justify-center lg:justify-start items-center pt-4">
                                <div className="text-center lg:text-left">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">98.2%</div>
                                    <div className="text-sm text-gray-400 font-medium">Pass Rate</div>
                                </div>
                                <div className="w-px h-12 bg-gray-700 hidden sm:block" />
                                <div className="text-center lg:text-left">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">500+</div>
                                    <div className="text-sm text-gray-400 font-medium">Flashcards</div>
                                </div>
                                <div className="w-px h-12 bg-gray-700 hidden sm:block" />
                                <div className="text-center lg:text-left">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">1000+</div>
                                    <div className="text-sm text-gray-400 font-medium">Practice Questions</div>
                                </div>
                            </div>

                            <Suspense fallback={<CTAPlaceholder />}>
                                <HeroCTAButtons />
                            </Suspense>

                            <p className="text-sm text-gray-400">
                                One-time payment · 12 months full access · All future updates included
                            </p>
                        </div>

                        {/* Right Image/Visual */}
                        <div className="relative lg:block hidden">
                            <div className="relative w-full max-w-md mx-auto">
                                {/* Decorative elements */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-cyan-500/30 rounded-3xl blur-2xl" />
                                <div className="relative bg-gradient-to-br from-[#1a2235] to-[#0f1729] border border-purple-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
                                    <div className="space-y-4 text-center">
                                        <Image
                                            src="/images/raju.jpg"
                                            alt="Raju - CISSP Certified Instructor"
                                            width={400}
                                            height={400}
                                            className="rounded-2xl mx-auto"
                                            quality={90}
                                        />
                                        <div className="space-y-1.5 pb-2">
                                            <p className="text-base font-semibold text-white">CISSP Certified | Industry Practitioner</p>
                                            <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Your Personal Certification Coach</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COMMENTED OUT - Stats Section
                        <div className="relative lg:block hidden">
                            <div className="relative w-full aspect-square">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-cyan-500/30 rounded-3xl blur-2xl" />
                                <div className="relative bg-gradient-to-br from-[#1a2235] to-[#0f1729] border border-purple-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600/20 to-transparent border border-purple-500/30 rounded-xl">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                                                <Check className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Domain 1: Security & Risk</div>
                                                <div className="text-lg font-bold text-white">Mastered 94%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-500/20 to-transparent border border-cyan-500/30 rounded-xl">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center">
                                                <Brain className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">AI Learning Path</div>
                                                <div className="text-lg font-bold text-white">Actively Adapting</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600/20 to-transparent border border-purple-500/30 rounded-xl">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Progress This Week</div>
                                                <div className="text-lg font-bold text-white">+28% Accuracy</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        */}
                    </div>

                    {/* Trusted by logos */}
                    <div className="mt-20 pt-12 border-t border-gray-800">
                        <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-semibold">
                            Trusted by professionals at
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
                            <div className="text-2xl font-bold text-gray-600">Fortune 500</div>
                            <div className="text-2xl font-bold text-gray-600">DoD</div>
                            <div className="text-2xl font-bold text-gray-600">Big 4</div>
                            <div className="text-2xl font-bold text-gray-600">FAANG</div>
                            <div className="text-2xl font-bold text-gray-600">FinTech</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
