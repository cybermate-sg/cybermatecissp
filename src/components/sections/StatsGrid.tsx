interface StatItemProps {
  value: string;
  label: string;
  gradient: string;
}

function StatItem({ value, label, gradient }: StatItemProps) {
  return (
    <div className="space-y-2">
      <div className={`text-5xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-gray-400">{label}</div>
    </div>
  );
}

export default function StatsGrid() {
  return (
    <div className="grid sm:grid-cols-3 gap-8 py-8">
      <StatItem value="$197" label="One-time payment" gradient="from-purple-400 to-cyan-400" />
      <StatItem value="12 Months" label="unlimited access" gradient="from-cyan-400 to-purple-400" />
      <StatItem value="$0" label="No subscription" gradient="from-purple-400 to-cyan-400" />
    </div>
  );
}
