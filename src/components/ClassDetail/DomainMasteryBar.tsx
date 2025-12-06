"use client";

interface DomainProgress {
  domain: number;
  name: string;
  progress: number;
  color: string;
}

interface DomainMasteryBarProps {
  domainProgress: DomainProgress[];
}

export function DomainMasteryBar({ domainProgress }: DomainMasteryBarProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Mastery Overview</h3>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Progress bar */}
        <div className="flex h-8 rounded-full overflow-hidden mb-4 shadow-inner">
          {domainProgress.map((domain) => (
            <div
              key={domain.domain}
              className="relative group transition-all hover:opacity-80"
              style={{
                width: `${100 / domainProgress.length}%`,
                backgroundColor: domain.color,
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <p className="font-semibold">Domain {domain.domain}</p>
                  <p className="text-gray-300">{domain.name}</p>
                  <p className="font-bold text-blue-400">{domain.progress}% mastered</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          ))}
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
