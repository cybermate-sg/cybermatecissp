import { useEffect, useState } from 'react';
import { initPerformanceMonitoring, getCurrentMetrics, PerformanceMetrics } from '@/lib/performance';

export function usePerformance(pageName?: string) {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [pageLoadTime, setPageLoadTime] = useState<number | null>(null);

  useEffect(() => {
    // Measure page load time
    if (typeof window !== 'undefined') {
      const currentMetrics = getCurrentMetrics();
      setPageLoadTime(currentMetrics.pageLoadTime);

      if (pageName) {
        console.log(`[Performance] Monitoring started for: ${pageName}`);
      }
    }

    // Initialize Web Vitals monitoring
    const handleMetricsUpdate = (updatedMetrics: Partial<PerformanceMetrics>) => {
      setMetrics(updatedMetrics);

      if (pageName) {
        console.log(`[Performance] Metrics updated for ${pageName}:`, updatedMetrics);
      }
    };

    initPerformanceMonitoring(handleMetricsUpdate);
  }, [pageName]);

  return {
    metrics,
    pageLoadTime,
  };
}
