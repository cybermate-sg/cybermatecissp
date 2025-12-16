"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DomainProgress {
  domain: number;
  name: string;
  progress: number;
  color: string;
}

interface DomainMasteryBarProps {
  domainProgress: DomainProgress[];
}

// Custom label to show only percentage
const renderLabel = (entry: any) => {
  return `${entry.progress}%`;
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
        <p className="font-semibold">Domain {data.domain}</p>
        <p className="text-gray-300">{data.name}</p>
        <p className="font-bold text-blue-400">{data.progress}% mastered</p>
      </div>
    );
  }
  return null;
};

export function DomainMasteryBar({ domainProgress }: DomainMasteryBarProps) {
  // Transform data to have equal slice sizes while preserving progress for labels
  const equalSizedData = domainProgress.map((domain) => ({
    ...domain,
    value: 1, // Equal size for all slices
  }));

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">
        Domain Mastery Overview
      </h3>
      <div className="bg-white/95 rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* First Pie Chart - CISSP */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={equalSizedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  label={renderLabel}
                  labelLine={false}
                >
                  {equalSizedData.map((domain, index) => (
                    <Cell key={`cell-${index}`} fill={domain.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-emerald-700 text-white font-bold text-xl px-3 py-1.5 rounded shadow-md">
                CISSP
              </div>
            </div>
          </div>

          {/* Second Pie Chart - CISSP Practice */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={equalSizedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  label={renderLabel}
                  labelLine={false}
                >
                  {equalSizedData.map((domain, index) => (
                    <Cell key={`cell-${index}`} fill={domain.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-emerald-700 text-white font-bold text-lg px-2.5 py-1.5 rounded shadow-md">
                CISSP Practice
              </div>
            </div>
          </div>
        </div>

        {/* Domain legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {domainProgress.map((domain) => (
            <div key={domain.domain} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: domain.color }}
              ></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  D{domain.domain}: {domain.name}
                </p>
                <p className="text-xs text-gray-500">{domain.progress}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
