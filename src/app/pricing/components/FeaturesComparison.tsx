import { FreePlanFeatures } from './FreePlanFeatures';
import { PaidPlanFeatures } from './PaidPlanFeatures';

export function FeaturesComparison() {
  return (
    <div className="mt-16 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        What&apos;s Included
      </h2>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <FreePlanFeatures />
          <PaidPlanFeatures />
        </div>
      </div>
    </div>
  );
}
