# Testing Error Boundaries

Guide for testing Error Boundaries in development.

## 1. Test Generic Error Boundary

Create a component that intentionally throws errors:

```tsx
// src/components/errors/__tests__/BuggyComponent.tsx
'use client'

export function BuggyComponent() {
  throw new Error('Test error boundary')
  return <div>Never rendered</div>
}
```

Then use it with Error Boundary:

```tsx
import { ErrorBoundary } from '@/components/errors'
import { BuggyComponent } from './__tests__/BuggyComponent'

<ErrorBoundary>
  <BuggyComponent />
</ErrorBoundary>
```

## 2. Test ContentErrorBoundary

To test the gallery error boundary:

```tsx
// In src/components/gallery/GalleryView.tsx (temporarily)
export function GalleryView({ initialContent, userId }: GalleryViewProps) {
  // Add this line to test
  if (initialContent.length > 0) {
    throw new Error('Test gallery error')
  }

  // ... rest of the code
}
```

Visit `/gallery` to see the error boundary in action.

## 3. Test UploadErrorBoundary

To test the upload error boundary:

```tsx
// In src/components/upload/UploadTabs.tsx (temporarily)
export function UploadTabs({ userId }: UploadTabsProps) {
  // Add this line to test
  throw new Error('Test upload error')

  // ... rest of the code
}
```

Visit `/upload` to see the error boundary in action.

## 4. Test Error Page (error.tsx)

Create a route that throws an error:

```tsx
// src/app/test-error/page.tsx
export default function TestErrorPage() {
  throw new Error('Test error page')
  return <div>Never rendered</div>
}
```

Visit `/test-error` to see the error page.

## 5. Test 404 Page (not-found.tsx)

Simply visit a URL that doesn't exist:

```
http://localhost:3000/this-page-does-not-exist
```

## Test Scenarios

### Scenario 1: Error during content loading
1. Go to `/gallery`
2. If there's an error fetching data, ContentErrorBoundary will be shown
3. Click "Ricarica contenuti" to retry

### Scenario 2: Error during upload
1. Go to `/upload`
2. If there's an error in the upload form, UploadErrorBoundary will be shown
3. Click "Ricarica modulo" to retry

### Scenario 3: Generic error in the app
1. Any uncaught React error will be handled by error.tsx
2. Shows error details in development
3. "Riprova" and "Torna alla Home" buttons

## Testing in Production

To test in production mode:

```bash
npm run build
npm start
```

In production mode:
- Error details are NOT shown
- Only user-friendly messages
- Errors logged to console (or external service if configured)

## Test Checklist

- [ ] ErrorBoundary catches generic React errors
- [ ] ContentErrorBoundary shows gallery-specific UI
- [ ] UploadErrorBoundary shows upload-specific UI
- [ ] error.tsx catches route-level errors
- [ ] not-found.tsx shows custom 404
- [ ] "Riprova" button works
- [ ] "Torna alla Home" button works
- [ ] "Torna indietro" button works (404)
- [ ] Festive colors (pink, purple, gold) display correctly
- [ ] Responsive UI on mobile
- [ ] Error details shown only in development
- [ ] Errors logged to console

## Important Notes

1. **Don't commit test code**: Remove `throw new Error()` before committing
2. **Test in development**: Error details are visible only in dev mode
3. **Test cross-browser**: Test on Chrome, Safari, Firefox
4. **Test mobile**: Verify on real mobile devices or emulator
