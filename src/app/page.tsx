import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { has } = await auth();
  const hasPaidPlan = has({ plan: 'paid' });
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-amber-400">CISSP A-Z</span> for Security Professionals:
              <br />
              <span className="text-white">Pass Your Exam in Weeks, not Months</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
              Fast-track your cybersecurity career, stay ahead in the industry and master
              the CISSP exam with confidence-based learning and adaptive spaced repetition.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {!hasPaidPlan && (
                <Link
                  href="/pricing"
                  className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  BUY NOW
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              <Link
                href="/sign-in"
                className="border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center"
              >
                {hasPaidPlan ? 'Go to Dashboard' : 'Try Free'}
              </Link>
            </div>

            {/* Student Count */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-slate-900"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-slate-900"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-slate-900"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-slate-900"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-slate-900"></div>
              </div>
              <p className="text-gray-300 font-medium">
                <span className="text-amber-400 font-bold">350+</span> security professionals
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] lg:aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/raju.jpg"
                alt="CISSP Security Expert"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Badge Overlay */}
              <div className="absolute top-6 left-6 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                #CISSP
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all">
            <div className="text-purple-400 text-4xl font-bold mb-3">8</div>
            <h3 className="text-white font-semibold text-lg mb-2">CISSP Domains</h3>
            <p className="text-gray-400">Complete coverage of all security domains</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all">
            <div className="text-purple-400 text-4xl font-bold mb-3">1000+</div>
            <h3 className="text-white font-semibold text-lg mb-2">Practice Questions</h3>
            <p className="text-gray-400">Confidence-based learning system</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all">
            <div className="text-purple-400 text-4xl font-bold mb-3">24/7</div>
            <h3 className="text-white font-semibold text-lg mb-2">Study Anywhere</h3>
            <p className="text-gray-400">Mobile-friendly adaptive learning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
