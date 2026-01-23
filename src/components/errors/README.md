# Error Boundaries

React components for graceful error handling in the g_gift app.

## Available Components

### 1. ErrorBoundary (Generic)

Generic Error Boundary that can be used anywhere in the app.

```tsx
import { ErrorBoundary } from '@/components/errors'

<ErrorBoundary
  fallback={customFallbackUI}
  onReset={() => console.log('Reset triggered')}
  showContactAdmin={true}
>
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `fallback?` - Custom UI to display in case of error
- `onReset?` - Callback called when user clicks "Riprova"
- `showContactAdmin?` - Show "Contact administrator" button

**Features:**
- Festive UI with brand colors (pink, purple, gold)
- "Riprova" and "Torna alla Home" buttons
- Shows error details in development mode
- Logs errors to console (dev) or external service (TODO)

### 2. ContentErrorBoundary

Error Boundary specific to content gallery.

```tsx
import { ContentErrorBoundary } from '@/components/errors'

<ContentErrorBoundary>
  <GalleryView />
</ContentErrorBoundary>
```

**Usage:**
- Wraps gallery components
- Specific message: "Error loading content"
- "Reload content" button

### 3. UploadErrorBoundary

Error Boundary specific to upload forms.

```tsx
import { UploadErrorBoundary } from '@/components/errors'

<UploadErrorBoundary>
  <UploadTabs />
</UploadErrorBoundary>
```

**Usage:**
- Wraps upload components
- Specific message: "Error in upload module"
- Includes hint about file limit (10MB)
- Shows "Contact administrator" button

## Next.js Error Pages

### error.tsx

Global error page for Next.js 14 App Router.

**Location:** `/src/app/error.tsx`

**Features:**
- Catches route-level errors
- "Riprova" button with reset() function
- "Torna alla Home" link
- Shows error.digest in development

### not-found.tsx

Custom 404 page.

**Location:** `/src/app/not-found.tsx`

**Features:**
- Festive design with emoji and confetti
- "Vai alla Home" button
- "Torna indietro" button
- Quick links to common pages (Login, Register, Gallery)

## Integration

Error Boundaries are already integrated in:

1. **Gallery Page** (`/app/(vip)/gallery/page.tsx`)
   - Wraps `<GalleryView>` with `<ContentErrorBoundary>`

2. **Upload Page** (`/app/(guest)/upload/page.tsx`)
   - Wraps `<UploadTabs>` with `<UploadErrorBoundary>`

## UI Design

All Error Boundaries follow the app's design system:

- **Colors:** Birthday pink, purple, gold
- **Style:** Festive and friendly
- **Language:** Italian
- **Icons:** Lucide React icons
- **Emoji:** Confetti, balloons, etc.

## Testing

To test Error Boundaries in development:

```tsx
// Add a component that throws errors
function BuggyComponent() {
  throw new Error('Test error boundary')
  return <div>Never rendered</div>
}

// Wrap with Error Boundary
<ErrorBoundary>
  <BuggyComponent />
</ErrorBoundary>
```

## Future TODO

- [ ] Integrate error tracking service (e.g. Sentry)
- [ ] Add analytics to track frequent errors
- [ ] Automatic email to admin for critical errors
- [ ] Automatic retry with exponential backoff
- [ ] Offline detection and handling
