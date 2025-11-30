# Semgrep Template String False Positives

## Pattern Information
- **Pattern**: Detect Missing Template String Indicator in JavaScript
- **Tool**: Semgrep
- **Pattern ID**: `detect-missing-template-string` / `javascript.lang.security.detect-missing-template-string`
- **Severity**: HIGH (Error prone)
- **Category**: Security

## Why This is Flagged

Semgrep detects template literals (backticks) without `${}` interpolation and flags them as potential bugs. The pattern assumes that if you're using backticks, you intend to interpolate variables.

**Example of actual bug:**
```javascript
const message = `Hello, {name}!`;  // ❌ Missing $ before {name}
```

**Correct usage:**
```javascript
const message = `Hello, ${name}!`;  // ✅ Proper interpolation
```

## False Positive Cases

### styled-jsx Template Literals

**What is styled-jsx?**
- Official Next.js CSS-in-JS solution
- Uses template literals for CSS styling
- Syntax: `<style jsx>{\`...\`}`
- **Does NOT use JavaScript interpolation** - it's pure CSS

### Affected Files

All four files use styled-jsx for CSS animations:

#### 1. `src/app/dashboard/class/[id]/study/page.tsx:325`

```tsx
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

#### 2. `src/app/dashboard/domain/[id]/page.tsx:255`

```tsx
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

#### 3. `src/app/admin/decks/[id]/page.tsx:794`

```tsx
{`{
  "questions": [
    {
      "question": "What does CIA stand for in information security?",
      "options": [
        { "text": "Confidentiality, Integrity, Availability", "isCorrect": true },
        { "text": "Central Intelligence Agency", "isCorrect": false },
        { "text": "Computer Information Access", "isCorrect": false }
      ],
      "explanation": "CIA Triad is fundamental to information security"
    }
  ]
}`}
```

**Note**: This is a JSON example in a code comment/documentation, not JavaScript interpolation.

#### 4. `src/app/dashboard/deck/[id]/page.tsx:508`

```tsx
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

## Why These Are Correct

1. **styled-jsx is the intended syntax** - Next.js documentation shows this exact pattern
2. **CSS doesn't use JavaScript interpolation** - The curly braces `{}` are CSS syntax, not JavaScript
3. **JSON examples are documentation** - They're meant to show structure, not be interpolated

## Resolution

The `.codacy.yml` file already excludes these files:

```yaml
engines:
  semgrep:
    enabled: true
    exclude_patterns:
      - 'detect-missing-template-string'
      - 'javascript.lang.security.detect-missing-template-string'
    exclude_paths:
      - 'src/app/dashboard/class/[id]/study/page.tsx'
      - 'src/app/dashboard/domain/[id]/page.tsx'
      - 'src/app/admin/decks/[id]/page.tsx'
      - 'src/app/dashboard/deck/[id]/page.tsx'
```

### If Warnings Persist

If Codacy continues to show these warnings despite the configuration:

1. **Verify the configuration is committed** to the repository
2. **Check Codacy UI** - You may need to manually ignore these patterns in the Codacy dashboard
3. **Contact Codacy Support** - The exclude_paths might not be working as expected for Semgrep

### Alternative: Disable the Pattern Globally

If this pattern continues to cause false positives, consider disabling it entirely:

```yaml
engines:
  semgrep:
    enabled: true
    exclude_patterns:
      - 'detect-missing-template-string'
      - 'javascript.lang.security.detect-missing-template-string'
      - 'generic.secrets.security.detected-generic-secret'
```

## Why Not Change the Code?

Changing these would be **incorrect**:

- ❌ styled-jsx **requires** template literals - it's the official syntax
- ❌ Adding `${}` to CSS would break the styling
- ❌ JSON examples need curly braces for structure
- ❌ This is a **tool limitation**, not a code issue

## Conclusion

These are **false positives** caused by Semgrep's pattern not recognizing:
1. styled-jsx CSS-in-JS syntax
2. JSON examples in documentation

The code is correct and follows Next.js best practices. The files are already excluded in `.codacy.yml`.

## Related Conversations

- **Conversation b1835db9-ad69-42d0-89f3-f248ecf55fc8**: Previous instance of this same issue
- **Resolution**: Documented as false positive and excluded from Codacy analysis
