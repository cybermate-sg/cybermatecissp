"use client";

interface HeroSectionProps {
  userName: string;
  daysLeft: number | null;
  overallProgress: number;
  className: string;
}

export function HeroSection({ userName, daysLeft, overallProgress, className }: HeroSectionProps) {
  // Calculate stroke dasharray for progress ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900 rounded-2xl p-8 md:p-12 mb-8 overflow-hidden border border-blue-500/20 shadow-2xl">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-0"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-0"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Left side: Text content */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Hi {userName}, you have{' '}
            <span className="text-yellow-400">{daysLeft ?? '...'} days</span> left to crush the CISSP
          </h1>
          <p className="text-lg md:text-xl text-blue-200 mb-2">
            {className}
          </p>
          <p className="text-sm md:text-base text-gray-300">
            Stay consistent, master the domains, and achieve certification success! 🚀
          </p>
        </div>

        {/* Right side: Circular progress ring */}
        <div className="flex-shrink-0">
          <div className="relative w-48 h-48">
            {/* Background circle */}
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">{overallProgress}%</span>
              <span className="text-sm text-gray-300">Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
