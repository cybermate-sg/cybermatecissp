import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load icons to reduce initial bundle
const ArrowRight = dynamic(
  () => import("lucide-react").then(mod => ({ default: mod.ArrowRight }))
);

const Target = dynamic(
  () => import("lucide-react").then(mod => ({ default: mod.Target }))
);

const BookOpen = dynamic(
  () => import("lucide-react").then(mod => ({ default: mod.BookOpen }))
);

const Brain = dynamic(
  () => import("lucide-react").then(mod => ({ default: mod.Brain }))
);

// Lazy load BuyNowButton for better initial page performance
const BuyNowButton = dynamic(() => import("@/components/BuyNowButton"), {
  loading: () => (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold px-8 py-4 rounded-full animate-pulse h-14 w-64" />
  ),
});

// Separate component for auth-dependent content
async function HeroCTAButtons() {
  const { has } = await auth();
  const hasPaidPlan = has ? has({ plan: 'paid' }) : false;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {hasPaidPlan ? (
        <Link
          href="/dashboard"
          className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <BuyNowButton
          priceId={process.env.STRIPE_LIFETIME_PRICE_ID!}
          text="Buy Now - Limited Time Offer"
        />
      )}
    </div>
  );
}

// Fallback loading state
function CTAPlaceholder() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold px-8 py-4 rounded-full animate-pulse h-14 w-64" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Pass the <span className="text-purple-600">CISSP</span> Exam.
                <br />
                First Time.
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Ditch the memorization. Master the concepts with our AI-driven adaptive learning platform and battle-tested study materials. Your success is our mission.
              </p>

              <Suspense fallback={<CTAPlaceholder />}>
                <HeroCTAButtons />
              </Suspense>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/raju.jpg"
                  alt="CISSP Security Professional"
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600">
              Our platform is designed to make complex security concepts simple and accessible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">8 CISSP Domains</h3>
              <p className="text-gray-600">
                Complete, in-depth coverage of all security domains required for the exam.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1000+ Practice Questions</h3>
              <p className="text-gray-600">
                A confidence-based learning system to identify and strengthen your weak areas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Driven Learning</h3>
              <p className="text-gray-600">
                Get real-time feedback and adaptive question paths tailored to your performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Trusted by Security Pros
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Join a growing community of professionals who passed the CISSP exam with our help.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white"></div>
                </div>
                <p className="text-gray-700 font-semibold">
                  <span className="text-purple-600 font-bold">350+</span> certified professionals
                </p>
              </div>
            </div>

            {/* Right Testimonial Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                  AJ
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Alex Johnson</h4>
                  <p className="text-sm text-gray-600">Certified CISSP</p>
                </div>
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                &quot;This was the only resource I needed. The practice questions were incredibly similar to the real exam, and the adaptive learning helped me focus exactly where I needed to. Highly recommended!&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Buy Now */}
      <section id="pricing" className="py-16 bg-gradient-to-br from-purple-600 to-purple-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Pass Your CISSP Exam?
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            Get lifetime access to all study materials, practice questions, and AI-driven learning features.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-purple-200 text-2xl line-through">$120</span>
              <span className="text-white text-5xl font-bold">$60 USD</span>
            </div>
            <BuyNowButton
              priceId={process.env.STRIPE_LIFETIME_PRICE_ID!}
              text="BUY NOW - Limited Time Offer"
              className="!bg-white !from-white !to-white !text-purple-700 hover:!bg-gray-100 hover:!from-gray-100 hover:!to-gray-100 !font-bold"
            />
            <p className="text-purple-200 text-sm">One-time payment • Lifetime access • No subscriptions</p>
          </div>
        </div>
      </section>
    </div>
  );
}
