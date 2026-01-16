import type { Metadata } from 'next';
import { PricingTable } from '@clerk/nextjs';
import { PricingHeader } from './components/PricingHeader';
import { FeaturesComparison } from './components/FeaturesComparison';
import { PricingFooter } from './components/PricingFooter';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Get 180-day access to CISSP Mastery for $197. 1000+ flashcards, adaptive spaced repetition, and a 98.2% pass rate.',
  openGraph: {
    title: 'CISSP Mastery Pricing | $197 for 180-Day Access',
    description: 'Pass CISSP on your first attempt with 1000+ flashcards and confidence-based learning. 180 days of full access.',
  },
};

// Force dynamic rendering to avoid build-time Clerk validation issues
export const dynamic = 'force-dynamic';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PricingHeader />

        <div className="max-w-5xl mx-auto">
          <PricingTable />
        </div>

        <FeaturesComparison />

        <PricingFooter />
      </div>
    </div>
  );
}
