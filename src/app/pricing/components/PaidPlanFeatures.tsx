export function PaidPlanFeatures() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-purple-400">Paid Plan</h3>
      <ul className="space-y-2 text-gray-300">
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>1000+ flashcards across all 8 CISSP domains</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Confidence-based adaptive learning</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Advanced spaced repetition algorithm</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Detailed progress analytics</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Priority support</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Save 50% with annual billing</span>
        </li>
      </ul>
    </div>
  );
}
