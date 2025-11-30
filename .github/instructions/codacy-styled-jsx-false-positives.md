# Codacy styled-jsx False Positives

## Issue Summary

Codacy flags `<style jsx>` template literals as "Error prone - This looks like a JavaScript template string" in the following files:

- `src/app/dashboard/class/[id]/study/page.tsx` (line 325)
- `src/app/dashboard/domain/[id]/page.tsx` (line 255)
- `src/app/admin/decks/[id]/page.tsx` (line 794)
- `src/app/dashboard/deck/[id]/page.tsx` (line 508)

## Why These Are False Positives

### 1. **styled-jsx is Official Next.js Syntax**

styled-jsx is a CSS-in-JS library that comes **built-in with Next.js**. The syntax `<style jsx>{`...`}</style>` is the correct and intended way to write component-scoped styles.

**Official Documentation:**
- [Next.js Built-in CSS Support - CSS-in-JS](https://nextjs.org/docs/app/building-your-application/styling/css-in-js)
- [styled-jsx GitHub](https://github.com/vercel/styled-jsx)

### 2. **The Pattern is Intentional**

```jsx
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

- The `{` + backtick combination is **required** by styled-jsx
- The content is static CSS, not dynamic user input
- There is **no security risk** or code smell here

### 3. **Benefits of styled-jsx**

- **Component-scoped**: Styles don't leak to other components
- **No class name conflicts**: Automatically generates unique class names
- **Server-side rendering**: Works perfectly with Next.js SSR
- **Zero runtime overhead**: Styles are extracted at build time

## Resolution Options

### Option 1: Suppress in Codacy (Recommended)

The `.codacy.yml` already has Semgrep exclusions configured:

```yaml
semgrep:
  enabled: true
  exclude_patterns:
    - 'detect-missing-template-string'
```

However, Codacy may be using a different pattern name. The files are also already in the `exclude_paths` list.

**Action**: Mark these specific warnings as "Won't Fix" or "False Positive" in the Codacy UI.

### Option 2: Migrate to Tailwind Animations

If you prefer to eliminate the warning entirely, you can replace styled-jsx with Tailwind's built-in animation utilities.

**See**: `codacy-tailwind-migration-example.md` for implementation details.

### Option 3: Disable Semgrep Entirely

If the false positives persist, you can disable Semgrep completely in `.codacy.yml`:

```yaml
semgrep:
  enabled: false
```

**Not recommended** as Semgrep catches real security issues.

## Conclusion

These warnings are **false positives** and can be safely ignored. The code follows Next.js best practices and poses no security or maintainability risks.

## References

- [Next.js CSS-in-JS Documentation](https://nextjs.org/docs/app/building-your-application/styling/css-in-js)
- [styled-jsx Repository](https://github.com/vercel/styled-jsx)
- [Semgrep Rule: detect-missing-template-string](https://semgrep.dev/r/javascript.lang.security.detect-missing-template-string)
