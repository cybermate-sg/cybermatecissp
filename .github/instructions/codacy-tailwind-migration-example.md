# Migrating styled-jsx to Tailwind Animations

## Overview

This guide shows how to replace the `styled-jsx` fade-in animations with Tailwind CSS, eliminating the Codacy warnings.

## Current Implementation (styled-jsx)

```jsx
<div className="animate-fade-in">
  {/* Content */}
</div>

<style jsx>{`
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`}</style>
```

## Migration Steps

### Step 1: Update `tailwind.config.ts`

Add the custom animation to your Tailwind configuration:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // ... existing config
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
};

export default config;
```

### Step 2: Update Components

Remove the `<style jsx>` block and use the Tailwind class:

**Before:**
```jsx
<div className="animate-fade-in">
  <ConfidenceRating onRate={handleRate} />
</div>

<style jsx>{`
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`}</style>
```

**After:**
```jsx
<div className="animate-fade-in">
  <ConfidenceRating onRate={handleRate} />
</div>
```

That's it! The animation is now defined globally in Tailwind.

## Files to Update

Apply this migration to the following files:

1. ✅ `src/app/dashboard/class/[id]/study/page.tsx` (line 325)
2. ✅ `src/app/dashboard/domain/[id]/page.tsx` (line 255)
3. ✅ `src/app/admin/decks/[id]/page.tsx` (line 794)
4. ✅ `src/app/dashboard/deck/[id]/page.tsx` (line 508)

## Benefits of This Approach

### Pros
- ✅ Eliminates Codacy warnings
- ✅ Centralized animation definitions
- ✅ Consistent with Tailwind patterns
- ✅ Better IDE autocomplete support
- ✅ Easier to maintain and reuse

### Cons
- ❌ Animation becomes global (but that's fine for a reusable animation)
- ❌ Requires Tailwind config rebuild (happens automatically in dev mode)

## Alternative: Use Tailwind's Built-in Animations

Tailwind has some built-in animations you could use instead:

```jsx
// Instead of custom fade-in, use Tailwind's fade-in
<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
  <ConfidenceRating onRate={handleRate} />
</div>
```

This requires the `tailwindcss-animate` plugin (already included in most Next.js setups).

## Testing

After migration, verify:

1. ✅ Animations still work correctly
2. ✅ No visual regressions
3. ✅ Codacy warnings are resolved
4. ✅ Build succeeds without errors

## Rollback Plan

If issues arise, you can easily revert by restoring the `<style jsx>` blocks from git history.

## Recommendation

**For this project**: Keep the styled-jsx implementation and mark the Codacy warnings as false positives. The current code is correct and follows Next.js best practices.

**For new animations**: Use Tailwind's animation system to maintain consistency and avoid future warnings.
