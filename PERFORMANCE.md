# Performance Monitoring & Optimization Guide

This document outlines the performance monitoring system and optimizations implemented in CISSP Mastery.

## Performance Monitoring System

### Web Vitals Tracked

The application now tracks all Core Web Vitals and additional performance metrics:

1. **TTFB (Time to First Byte)** - Server response time
   - Good: ≤ 800ms
   - Needs Improvement: 800ms - 1800ms
   - Poor: > 1800ms

2. **FCP (First Contentful Paint)** - Time until first content is rendered
   - Good: ≤ 1.8s
   - Needs Improvement: 1.8s - 3.0s
   - Poor: > 3.0s

3. **LCP (Largest Contentful Paint)** - Time until largest content element is rendered
   - Good: ≤ 2.5s
   - Needs Improvement: 2.5s - 4.0s
   - Poor: > 4.0s

4. **TTI (Time to Interactive)** - Time until page is fully interactive
   - Good: ≤ 3.8s
   - Needs Improvement: 3.8s - 7.3s
   - Poor: > 7.3s

5. **CLS (Cumulative Layout Shift)** - Visual stability score
   - Good: ≤ 0.1
   - Needs Improvement: 0.1 - 0.25
   - Poor: > 0.25

6. **INP (Interaction to Next Paint)** - Responsiveness to user interactions (replaces FID)
   - Good: ≤ 200ms
   - Needs Improvement: 200ms - 500ms
   - Poor: > 500ms

7. **Page Load Time** - Total time to load the page
   - Good: ≤ 2s
   - Needs Improvement: 2s - 4s
   - Poor: > 4s

### How to Monitor Performance

#### Development Mode

To view performance metrics in development, add `showVisual={true}` to the PerformanceMonitor component:

```tsx
<PerformanceMonitor pageName="Your Page Name" showVisual={true} />
```

This will show a visual dashboard in the bottom-right corner with real-time metrics.

#### Production Mode

In production, metrics are automatically logged to the browser console. You can:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[Performance]` logs

#### Adding Performance Monitoring to New Pages

```tsx
import PerformanceMonitor from "@/components/PerformanceMonitor";

export default function YourPage() {
  return (
    <div>
      <PerformanceMonitor pageName="Your Page Name" showVisual={false} />
      {/* Your page content */}
    </div>
  );
}
```

### Current Implementation

Performance monitoring is currently enabled on:
- ✅ Class Detail Page ([/dashboard/class/[id]/page.tsx](src/app/dashboard/class/[id]/page.tsx))
- ✅ Class Study Page ([/dashboard/class/[id]/study/page.tsx](src/app/dashboard/class/[id]/study/page.tsx))
- ✅ Deck Study Page ([/dashboard/deck/[id]/page.tsx](src/app/dashboard/deck/[id]/page.tsx))

## Performance Optimizations Implemented

### Critical Optimizations (Applied)

#### 1. Database Query Optimization - **N+1 Query Fix**

**Problem Identified**: The Class Detail API (`/api/classes/[id]`) was making N+1 database queries, causing **8+ second response times**.

**Solution**: [src/app/api/classes/[id]/route.ts:42-81](src/app/api/classes/[id]/route.ts#L42-L81)
- Replaced N separate queries (one per deck) with a single batch query
- Used `Set` for O(1) lookup instead of array filtering
- Reduced database round trips from N+1 to 2 queries

**Impact**:
- **Expected TTFB improvement**: 8s → ~1-2s (75-87% faster)
- **Database load reduced**: N+1 queries → 2 queries
- **Scalability**: Performance now consistent regardless of deck count

#### 2. API Response Caching

**Implementation**: [src/app/api/classes/[id]/route.ts:94](src/app/api/classes/[id]/route.ts#L94)
```typescript
response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
```

**Impact**:
- Subsequent visits serve cached data
- 60-second cache + 120-second stale-while-revalidate
- Reduces server load and improves repeat visit performance

#### 3. React Performance Optimizations

**Implementation**: [src/app/dashboard/class/[id]/page.tsx:107-135](src/app/dashboard/class/[id]/page.tsx#L107-L135)

Optimizations applied:
- `useMemo` for expensive calculations (totalCards, totalStudied, overallProgress)
- `useCallback` for event handlers (toggleDeckSelection, toggleSelectAll)
- Prevents unnecessary re-renders and recalculations

**Impact**:
- Reduced component re-renders
- Faster UI interactions
- Better FPS during user interactions

#### 4. Loading Skeleton UI

**Implementation**: [src/app/dashboard/class/[id]/page.tsx:137-165](src/app/dashboard/class/[id]/page.tsx#L137-L165)

Replaced generic "Loading..." text with structured skeleton:
- Visual placeholder matching actual UI layout
- Reduces perceived load time
- Better user experience

**Impact**:
- **Perceived performance**: Users see content structure immediately
- **CLS (Cumulative Layout Shift)**: Reduced layout shift when real content loads

### Additional Optimizations

### 1. Image Optimization

**Configuration**: [next.config.ts:25-28](next.config.ts#L25-L28)

- ✅ Modern image formats (AVIF, WebP) for better compression
- ✅ Responsive image sizes for different devices
- ✅ Image caching with 60-second TTL
- ✅ Optimized device sizes and image sizes

**Impact**:
- Reduces image file sizes by 30-50%
- Faster image loading on mobile devices
- Better bandwidth utilization

### 2. Compiler Optimizations

**Configuration**: [next.config.ts:30-35](next.config.ts#L30-L35)

- ✅ Remove console.log in production (except errors and warnings)
- ✅ Optimized package imports for `lucide-react` and `@clerk/nextjs`

**Impact**:
- Smaller bundle sizes
- Faster tree-shaking
- Reduced JavaScript payload

### 3. Component Lazy Loading

**Component**: [LazyFlashcard.tsx](src/components/LazyFlashcard.tsx)

Dynamic import wrapper for the Flashcard component with:
- Loading state during import
- SSR enabled for SEO
- Code splitting for smaller initial bundle

**Usage**:
```tsx
import LazyFlashcard from "@/components/LazyFlashcard";

// Use instead of direct Flashcard import for better performance
<LazyFlashcard question={q} answer={a} onFlip={handleFlip} />
```

**Impact**:
- Reduces initial page load time
- Better code splitting
- Improved Time to Interactive (TTI)

### 4. Performance Monitoring Utilities

**Files**:
- [lib/performance.ts](src/lib/performance.ts) - Core performance tracking utilities
- [hooks/usePerformance.ts](src/hooks/usePerformance.ts) - React hook for performance monitoring
- [components/PerformanceMonitor.tsx](src/components/PerformanceMonitor.tsx) - Visual dashboard component

**Features**:
- Real-time Web Vitals tracking
- Performance rating system
- Console logging for debugging
- Visual dashboard for development

## Recommended Additional Optimizations

### 1. Implement Route Prefetching

Add prefetch hints for likely navigation paths:

```tsx
import Link from "next/link";

<Link href="/dashboard/class/123" prefetch={true}>
  View Class
</Link>
```

### 2. Add Loading States

Implement Suspense boundaries for better perceived performance:

```tsx
import { Suspense } from "react";

<Suspense fallback={<LoadingSpinner />}>
  <YourComponent />
</Suspense>
```

### 3. Optimize Database Queries

- Add database indexes for frequently queried fields
- Use `select` to fetch only needed columns
- Implement query result caching

### 4. Enable Edge Runtime

For static or semi-static pages, enable Edge runtime:

```tsx
export const runtime = 'edge';
```

### 5. Implement Service Worker

Add offline support and caching strategies with a service worker.

### 6. Code Splitting

Split large pages into smaller chunks:

```tsx
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

## Performance Testing

### Tools

1. **Lighthouse** - Run in Chrome DevTools
2. **WebPageTest** - https://www.webpagetest.org
3. **Chrome DevTools Performance Tab** - Record and analyze runtime performance

### Testing Checklist

- [ ] Test on 3G/4G network throttling
- [ ] Test on mobile devices
- [ ] Test with different screen sizes
- [ ] Run Lighthouse audit
- [ ] Check bundle sizes with `npm run build`
- [ ] Monitor server response times

## Monitoring in Production

### Analytics Integration

Consider integrating with analytics platforms:

```tsx
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics platform
  // e.g., Google Analytics, Mixpanel, etc.
  console.log(metric);
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

## Performance Budget

Recommended performance budgets:

| Metric | Target | Maximum |
|--------|--------|---------|
| FCP | < 1.5s | 2.0s |
| LCP | < 2.0s | 3.0s |
| TTI | < 3.5s | 5.0s |
| CLS | < 0.05 | 0.1 |
| INP | < 100ms | 200ms |
| Total Bundle Size | < 200KB | 300KB |
| Image Sizes | < 100KB each | 200KB each |

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [Core Web Vitals Guide](https://web.dev/learn-core-web-vitals/)
