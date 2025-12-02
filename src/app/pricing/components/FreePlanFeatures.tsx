export function FreePlanFeatures() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400">Free Plan</h3>
      <ul className="space-y-2 text-gray-300">
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Access to limited flashcards</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Basic progress tracking</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <span>Community support</span>
        </li>
      </ul>
    </div>
  );
}
