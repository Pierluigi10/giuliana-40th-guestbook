# Error Handling Flow - g_gift

Error handling flow diagram for the application.

## Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    g_gift Application                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Root Layout (app/layout.tsx)                │
│                   - Global error boundary                    │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│   Gallery Page (VIP)  │   │  Upload Page (Guest)  │
│  /app/(vip)/gallery   │   │  /app/(guest)/upload  │
└───────────────────────┘   └───────────────────────┘
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│ ContentErrorBoundary  │   │ UploadErrorBoundary   │
│  - Wraps GalleryView  │   │  - Wraps UploadTabs   │
└───────────────────────┘   └───────────────────────┘
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│    GalleryView        │   │    UploadTabs         │
│  - Content display    │   │  - Upload forms       │
│  - Reactions          │   │  - Text/Image/Video   │
└───────────────────────┘   └───────────────────────┘
```

## Error Handling Layers

### Layer 1: Route-Level (error.tsx)

```
User navigates → Page throws error → error.tsx catches → Shows error UI
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                    [Reset Button]                      [Go Home Button]
                                            │                                   │
                                            ▼                                   ▼
                                    Retry render                        Navigate to /
```

**Catches:**
- Server-side rendering errors
- Data fetching errors
- Route initialization errors

### Layer 2: Component-Level (ErrorBoundary)

```
Component renders → Error thrown → ErrorBoundary catches → Shows fallback UI
                                                                    │
                                          ┌─────────────────────────┴─────────────────────┐
                                          ▼                                               ▼
                                  [Retry Button]                              [Home Button]
                                          │                                               │
                                          ▼                                               ▼
                                  Reset state                                   Navigate to /
                                  Call onReset()
```

**Catches:**
- React component errors
- Lifecycle errors
- Event handler errors (render-time)

### Layer 3: Specific Boundaries

#### ContentErrorBoundary (Gallery)

```
Gallery loads → Content error → ContentErrorBoundary → Specific error UI
                                                              │
                                                              ▼
                                                    [Reload Content Button]
                                                              │
                                                              ▼
                                                      window.location.reload()
```

**Catches:**
- Content fetching errors
- Image/video loading errors
- Reaction system errors

#### UploadErrorBoundary (Upload)

```
Upload form → Upload error → UploadErrorBoundary → Specific error UI
                                                          │
                                          ┌───────────────┴───────────────┐
                                          ▼                               ▼
                                  [Reload Form]                [Contact Admin]
                                          │                               │
                                          ▼                               ▼
                                window.location.reload()        mailto: link
```

**Catches:**
- Form rendering errors
- File upload errors
- Validation errors

### Layer 4: 404 Not Found

```
Invalid URL → Next.js routing → not-found.tsx → Custom 404 UI
                                                       │
                               ┌───────────────────────┴───────────────────────┐
                               ▼                                               ▼
                        [Go Home Button]                            [Quick Links]
                               │                                               │
                               ▼                                               ▼
                        Navigate to /                           Login, Register, Gallery
```

**Triggers:**
- Non-existent routes
- Manual `notFound()` calls

## Error Flow Decision Tree

```
                        Error Occurs
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        React Component Error       HTTP Route Error
                │                         │
                ▼                         ▼
    ┌───────────────────┐         ┌─────────────┐
    │ In Gallery page?  │         │   404?      │
    └───────────────────┘         └─────────────┘
         │         │                   │      │
         Yes       No              Yes        No
         ▼         ▼                   ▼      ▼
  ContentError   UploadError      not-found  error.tsx
   Boundary       Boundary          .tsx
         │         │                   │      │
         └─────┬───┘                   └──┬───┘
               │                          │
               ▼                          ▼
      Show specific                Show generic
      error UI                     error UI
               │                          │
               └──────────┬───────────────┘
                          ▼
                  User can recover:
                  - Retry
                  - Go home
                  - Contact admin
```

## Error Types & Handlers

| Error Type | Handler | User Action | Technical Action |
|------------|---------|-------------|------------------|
| **Gallery Load Error** | ContentErrorBoundary | Click "Ricarica contenuti" | Page reload |
| **Upload Form Error** | UploadErrorBoundary | Click "Ricarica modulo" | Page reload |
| **Route Error** | error.tsx | Click "Riprova" | reset() function |
| **404 Not Found** | not-found.tsx | Click "Vai alla Home" | Navigate to / |
| **Generic Error** | ErrorBoundary | Click "Riprova" | Component re-render |
| **Auth Error** | Redirect | N/A | Redirect to /login |

## Development vs Production

### Development Mode
```
Error Occurs
    │
    ├─ Log to console (full stack trace)
    ├─ Show error details in UI
    ├─ Show error.digest (if available)
    └─ Show error message verbatim
```

### Production Mode
```
Error Occurs
    │
    ├─ Log to external service (TODO: Sentry)
    ├─ Show user-friendly message only
    ├─ Hide technical details
    └─ Show generic "Something went wrong"
```

## Recovery Strategies

### 1. Automatic Recovery
- **Not implemented yet**
- Future: Retry with exponential backoff
- Future: Offline detection and queue

### 2. User-Initiated Recovery
- **Retry button:** Re-render component
- **Reload button:** Full page reload
- **Home button:** Navigate to safe route
- **Back button:** Browser history back

### 3. Admin Contact
- **Contact Admin button:** Opens mailto link
- Future: In-app support chat
- Future: Automatic error report email

## Monitoring & Logging

### Current Implementation
```typescript
// In ErrorBoundary
if (process.env.NODE_ENV === 'development') {
  console.error('ErrorBoundary caught:', error, errorInfo)
}

// TODO: Production logging
// logErrorToService(error, errorInfo)
```

### Future Integration (TODO)
```typescript
import * as Sentry from '@sentry/nextjs'

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    })
  }
}
```

## Testing Error Boundaries

### Manual Testing
```tsx
// Add temporary error-throwing component
function TestError() {
  throw new Error('Test error boundary')
}

// Wrap with boundary
<ErrorBoundary>
  <TestError />
</ErrorBoundary>
```

### Automated Testing
```typescript
// Jest + React Testing Library
test('ErrorBoundary catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test')
  }

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText(/Ops! Qualcosa è andato storto/)).toBeInTheDocument()
})
```

## Best Practices Implemented

✅ Multiple error boundary layers (defense in depth)
✅ Specific error messages per context
✅ User-friendly Italian language
✅ Festive, on-brand design
✅ Clear recovery actions (CTA)
✅ Development vs Production handling
✅ Graceful degradation
✅ No data loss messaging
✅ Accessible error UI
✅ Mobile-responsive design

## Summary

The error handling architecture is structured on 4 layers:

1. **Route-level** (error.tsx) - Catches routing errors
2. **Generic Component** (ErrorBoundary) - Catches generic React errors
3. **Specific Boundaries** (Content/Upload) - Catches context-specific errors
4. **404 Handler** (not-found.tsx) - Handles page not found

Each layer provides a progressively more specific and contextual user experience, ensuring users can always recover from unexpected errors.
