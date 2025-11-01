import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  CLS: number | null;
  INP: number | null;
  FCP: number | null;
  LCP: number | null;
  TTFB: number | null;
  TTI: number | null;
}

type MetricCallback = (metrics: Partial<PerformanceMetrics>) => void;

/**
 * Initialize Web Vitals monitoring
 * Tracks Core Web Vitals and reports them via callback
 */
export function initPerformanceMonitoring(callback: MetricCallback) {
  const metrics: Partial<PerformanceMetrics> = {};

  const handleMetric = (metric: Metric) => {
    metrics[metric.name as keyof PerformanceMetrics] = metric.value;

    // Log to console for development
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });

    // Send updated metrics to callback
    callback(metrics);
  };

  // Track Core Web Vitals
  onCLS(handleMetric);
  onINP(handleMetric);
  onFCP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);

  // Track TTI using Performance Observer
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name === 'tti') {
            metrics.TTI = entry.duration;
            console.log('[Performance] TTI:', entry.duration);
            callback(metrics);
          }
        });
      });
      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('[Performance] TTI tracking not supported:', error);
    }
  }
}

/**
 * Get formatted performance ratings
 */
export function getPerformanceRating(metric: keyof PerformanceMetrics, value: number | null): string {
  if (value === null) return 'N/A';

  const thresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    INP: { good: 200, needsImprovement: 500 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    TTI: { good: 3800, needsImprovement: 7300 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return 'Unknown';

  if (value <= threshold.good) return 'Good';
  if (value <= threshold.needsImprovement) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metric: keyof PerformanceMetrics, value: number | null): string {
  if (value === null) return 'N/A';

  // CLS is unitless
  if (metric === 'CLS') {
    return value.toFixed(3);
  }

  // All others are in milliseconds
  return `${Math.round(value)}ms`;
}

/**
 * Measure page load time
 */
export function measurePageLoadTime(): number | null {
  if (typeof window === 'undefined') return null;

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!perfData) return null;

  const loadTime = perfData.loadEventEnd - perfData.fetchStart;
  console.log('[Performance] Page Load Time:', loadTime);
  return loadTime;
}

/**
 * Get all current performance metrics
 */
export function getCurrentMetrics(): PerformanceMetrics & { pageLoadTime: number | null } {
  const pageLoadTime = measurePageLoadTime();

  return {
    CLS: null,
    INP: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    TTI: null,
    pageLoadTime,
  };
}
