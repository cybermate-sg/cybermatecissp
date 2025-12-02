import { PricingTable } from '@clerk/nextjs';
import { PricingHeader } from './components/PricingHeader';
import { FeaturesComparison } from './components/FeaturesComparison';
import { PricingFooter } from './components/PricingFooter';

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
