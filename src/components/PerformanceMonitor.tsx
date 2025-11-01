"use client";

import { usePerformance } from '@/hooks/usePerformance';
import { formatMetricValue, getPerformanceRating } from '@/lib/performance';

interface PerformanceMonitorProps {
  pageName: string;
  showVisual?: boolean; // Show visual dashboard (for development)
}

export default function PerformanceMonitor({ pageName, showVisual = false }: PerformanceMonitorProps) {
  const { metrics, pageLoadTime } = usePerformance(pageName);

  if (!showVisual) {
    // Silent monitoring - only logs to console
    return null;
  }

  // Development dashboard
  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs font-mono text-white shadow-xl z-[9999] max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Performance Monitor</h3>
        <span className="text-purple-400">{pageName}</span>
      </div>

      <div className="space-y-2">
        {pageLoadTime !== null && (
          <MetricRow
            label="Page Load"
            value={`${Math.round(pageLoadTime)}ms`}
            rating={getLoadTimeRating(pageLoadTime)}
          />
        )}

        {metrics.TTFB !== null && metrics.TTFB !== undefined && (
          <MetricRow
            label="TTFB"
            value={formatMetricValue('TTFB', metrics.TTFB)}
            rating={getPerformanceRating('TTFB', metrics.TTFB)}
          />
        )}

        {metrics.FCP !== null && metrics.FCP !== undefined && (
          <MetricRow
            label="FCP"
            value={formatMetricValue('FCP', metrics.FCP)}
            rating={getPerformanceRating('FCP', metrics.FCP)}
          />
        )}

        {metrics.LCP !== null && metrics.LCP !== undefined && (
          <MetricRow
            label="LCP"
            value={formatMetricValue('LCP', metrics.LCP)}
            rating={getPerformanceRating('LCP', metrics.LCP)}
          />
        )}

        {metrics.TTI !== null && metrics.TTI !== undefined && (
          <MetricRow
            label="TTI"
            value={formatMetricValue('TTI', metrics.TTI)}
            rating={getPerformanceRating('TTI', metrics.TTI)}
          />
        )}

        {metrics.CLS !== null && metrics.CLS !== undefined && (
          <MetricRow
            label="CLS"
            value={formatMetricValue('CLS', metrics.CLS)}
            rating={getPerformanceRating('CLS', metrics.CLS)}
          />
        )}

        {metrics.INP !== null && metrics.INP !== undefined && (
          <MetricRow
            label="INP"
            value={formatMetricValue('INP', metrics.INP)}
            rating={getPerformanceRating('INP', metrics.INP)}
          />
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, rating }: { label: string; value: string; rating: string }) {
  const getRatingColor = (rating: string) => {
    if (rating === 'Good') return 'text-green-400';
    if (rating === 'Needs Improvement') return 'text-yellow-400';
    if (rating === 'Poor') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold">{value}</span>
        <span className={`${getRatingColor(rating)} text-[10px]`}>
          {rating}
        </span>
      </div>
    </div>
  );
}

function getLoadTimeRating(ms: number): string {
  if (ms <= 2000) return 'Good';
  if (ms <= 4000) return 'Needs Improvement';
  return 'Poor';
}
