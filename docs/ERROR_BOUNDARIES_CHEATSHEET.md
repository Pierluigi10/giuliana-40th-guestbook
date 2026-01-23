# Error Boundaries Cheatsheet

Quick reference guide for developers - g_gift error handling.

## Quick Import

```tsx
// Single imports
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'
import { ContentErrorBoundary } from '@/components/errors/ContentErrorBoundary'
import { UploadErrorBoundary } from '@/components/errors/UploadErrorBoundary'

// Multiple imports (recommended)
import {
  ErrorBoundary,
  ContentErrorBoundary,
  UploadErrorBoundary
} from '@/components/errors'
```

## Usage Examples

### 1. Generic Error Boundary

```tsx
// Basic usage
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>

// With reset callback
<ErrorBoundary onReset={() => refetchData()}>
  <MyComponent />
</ErrorBoundary>

// With contact admin button
<ErrorBoundary showContactAdmin={true}>
  <MyComponent />
</ErrorBoundary>

// Complete example
<ErrorBoundary
  fallback={<div>Custom error</div>}
  onReset={() => console.log('Reset!')}
  showContactAdmin={true}
>
  <MyComponent />
</ErrorBoundary>
```

### 2. Content Error Boundary (Gallery)

```tsx
// In gallery page
<ContentErrorBoundary>
  <GalleryView initialContent={content} userId={userId} />
</ContentErrorBoundary>

// In content card
<ContentErrorBoundary>
  <ContentCard content={item} />
</ContentErrorBoundary>
```

### 3. Upload Error Boundary

```tsx
// In upload page
<UploadErrorBoundary>
  <UploadTabs userId={userId} />
</UploadErrorBoundary>

// Around upload form
<UploadErrorBoundary>
  <ImageUpload userId={userId} />
</UploadErrorBoundary>
```

## Component Props

### ErrorBoundary

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Components to wrap |
| `fallback` | ReactNode | `undefined` | Custom error UI |
| `onReset` | `() => void` | `undefined` | Callback on "Riprova" |
| `showContactAdmin` | boolean | `false` | Show "Contact admin" button |

### ContentErrorBoundary / UploadErrorBoundary

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Components to wrap |

_Note: These have pre-configured context-specific fallback UIs_

## When to Use What

| Scenario | Use | Why |
|----------|-----|-----|
| Gallery/Content display | `ContentErrorBoundary` | Specific messages for content |
| Upload forms | `UploadErrorBoundary` | File size hints, contact admin |
| Generic component | `ErrorBoundary` | Flexible, configurable |
| New feature | `ErrorBoundary` | Then specialize if needed |
| Admin dashboard | `ErrorBoundary` | Generic is fine |
| Auth forms | `ErrorBoundary` | Generic is fine |

## Error Pages

### error.tsx (Route Errors)

```tsx
// Automatically used by Next.js - no import needed
// Located at: /src/app/error.tsx

// Catches:
// - Server component errors
// - Data fetching errors
// - Route initialization errors
```

### not-found.tsx (404 Errors)

```tsx
// Automatically used by Next.js - no import needed
// Located at: /src/app/not-found.tsx

// Trigger manually:
import { notFound } from 'next/navigation'

if (!data) {
  notFound() // Will render not-found.tsx
}
```

## Testing

### Create Test Error Component

```tsx
// src/components/__tests__/ErrorTest.tsx
'use client'

export function ErrorTest({ shouldError = true }: { shouldError?: boolean }) {
  if (shouldError) {
    throw new Error('Test error boundary')
  }
  return <div>No error</div>
}
```

### Use in Development

```tsx
import { ErrorTest } from '@/components/__tests__/ErrorTest'

<ErrorBoundary>
  <ErrorTest shouldError={true} />
</ErrorBoundary>
```

### Test Different Scenarios

```tsx
// Test ContentErrorBoundary
<ContentErrorBoundary>
  <ErrorTest />
</ContentErrorBoundary>

// Test UploadErrorBoundary
<UploadErrorBoundary>
  <ErrorTest />
</UploadErrorBoundary>

// Test with custom reset
<ErrorBoundary onReset={() => alert('Reset clicked!')}>
  <ErrorTest />
</ErrorBoundary>
```

## Common Patterns

### Pattern 1: Nested Boundaries

```tsx
// Page level
<ErrorBoundary>
  <PageLayout>
    {/* Section level */}
    <ContentErrorBoundary>
      <GalleryView />
    </ContentErrorBoundary>

    {/* Another section */}
    <ErrorBoundary>
      <SidebarWidget />
    </ErrorBoundary>
  </PageLayout>
</ErrorBoundary>
```

### Pattern 2: Conditional Boundary

```tsx
function MyComponent({ hasData }: { hasData: boolean }) {
  if (!hasData) {
    return <EmptyState />
  }

  return (
    <ErrorBoundary>
      <DataDisplay />
    </ErrorBoundary>
  )
}
```

### Pattern 3: Boundary with Loading

```tsx
function MyComponent() {
  const [isLoading, setIsLoading] = useState(true)

  if (isLoading) {
    return <Skeleton />
  }

  return (
    <ErrorBoundary onReset={() => setIsLoading(true)}>
      <DataDisplay />
    </ErrorBoundary>
  )
}
```

## Don't Do This

### ❌ Bad: Too Many Boundaries

```tsx
// Overkill - too many unnecessary boundaries
<ErrorBoundary>
  <ErrorBoundary>
    <ErrorBoundary>
      <SimpleComponent />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>
```

### ❌ Bad: Boundary on Async

```tsx
// Doesn't work - async errors not caught
<ErrorBoundary>
  {async () => {
    throw new Error('Not caught!')
  }}
</ErrorBoundary>
```

### ❌ Bad: Event Handler Errors

```tsx
// Doesn't catch errors in event handlers
function MyButton() {
  const onClick = () => {
    throw new Error('Not caught by boundary!')
  }

  return <button onClick={onClick}>Click</button>
}

<ErrorBoundary>
  <MyButton />
</ErrorBoundary>
```

**Fix:** Use try-catch in event handlers:

```tsx
function MyButton() {
  const onClick = () => {
    try {
      // risky operation
    } catch (error) {
      console.error(error)
      toast.error('Errore!')
    }
  }

  return <button onClick={onClick}>Click</button>
}
```

## Do This

### ✅ Good: Strategic Placement

```tsx
// Boundary around critical sections
<PageLayout>
  <Header /> {/* No boundary - static */}

  <ErrorBoundary>
    <MainContent /> {/* Boundary - dynamic data */}
  </ErrorBoundary>

  <Footer /> {/* No boundary - static */}
</PageLayout>
```

### ✅ Good: Granular Boundaries

```tsx
// Multiple specific boundaries
<Dashboard>
  <ContentErrorBoundary>
    <Gallery />
  </ContentErrorBoundary>

  <UploadErrorBoundary>
    <UploadForm />
  </UploadErrorBoundary>

  <ErrorBoundary>
    <Stats />
  </ErrorBoundary>
</Dashboard>
```

### ✅ Good: Error + Loading States

```tsx
function DataComponent() {
  const { data, isLoading, error } = useQuery()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <ErrorBoundary>
      <DataDisplay data={data} />
    </ErrorBoundary>
  )
}
```

## Debugging

### Check Error in Console (Dev)

```bash
# Open browser console
# All errors logged with full stack trace
```

### Trigger Test Error

```tsx
// Add temporarily to any component
throw new Error('DEBUG: Testing error boundary')
```

### Check Error Digest (Production)

```tsx
// In error.tsx, error object has digest
console.log(error.digest) // Next.js error tracking ID
```

## Quick Commands

```bash
# Development
npm run dev

# Test build
npm run build

# Production
npm start

# Type check
npx tsc --noEmit
```

## File Locations

```
src/
├── components/
│   └── errors/
│       ├── ErrorBoundary.tsx
│       ├── ContentErrorBoundary.tsx
│       ├── UploadErrorBoundary.tsx
│       ├── index.ts
│       ├── README.md
│       └── TEST.md
└── app/
    ├── error.tsx
    └── not-found.tsx
```

## External Resources

- [React Error Boundaries Docs](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js error.tsx Docs](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Next.js not-found.tsx Docs](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)

## Support

For questions or issues:
1. Read `/src/components/errors/README.md`
2. Consult `/docs/ERROR_HANDLING_FLOW.md`
3. Test with `/src/components/errors/TEST.md`
4. Contact team lead

---

**Last Updated:** 2026-01-23
**Version:** 1.0.0
