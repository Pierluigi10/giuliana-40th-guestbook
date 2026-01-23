# Loading Components Documentation

This directory contains all loading state components for the g_gift application. These components provide visual feedback during data fetching, form submissions, and page navigation.

## Components Overview

### 1. Skeleton (`/ui/skeleton.tsx`)
Base skeleton component with pulse animation.

**Usage:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-10 w-32" />
```

### 2. Spinner (`Spinner.tsx`)
Customizable loading spinner with multiple sizes.

**Components:**
- `Spinner` - Basic spinner (sm, md, lg sizes)
- `LoadingOverlay` - Full overlay with spinner and optional message
- `CenteredSpinner` - Centered spinner for full-page loading

**Usage:**
```tsx
import { Spinner, LoadingOverlay, CenteredSpinner } from '@/components/loading/Spinner'

// Basic spinner
<Spinner size="md" className="text-birthday-purple" />

// Overlay on a container
<div className="relative">
  <YourContent />
  {isLoading && <LoadingOverlay message="Caricamento..." />}
</div>

// Centered full-page
<CenteredSpinner message="Caricamento galleria..." size="lg" />
```

### 3. ContentCardSkeleton (`ContentCardSkeleton.tsx`)
Skeleton for gallery content cards with masonry layout support.

**Components:**
- `ContentCardSkeleton` - Single card skeleton
- `ContentCardSkeletonGrid` - Grid of skeleton cards

**Usage:**
```tsx
import { ContentCardSkeletonGrid } from '@/components/loading/ContentCardSkeleton'

<ContentCardSkeletonGrid count={9} />
```

### 4. UserCardSkeleton (`UserCardSkeleton.tsx`)
Skeleton for admin user approval cards.

**Components:**
- `UserCardSkeleton` - Single user card skeleton
- `UserCardSkeletonList` - List of user card skeletons

**Usage:**
```tsx
import { UserCardSkeletonList } from '@/components/loading/UserCardSkeleton'

<UserCardSkeletonList count={5} />
```

### 5. ContentModerationSkeleton (`ContentModerationSkeleton.tsx`)
Skeleton for admin content moderation cards.

**Components:**
- `ContentModerationSkeleton` - Single moderation card skeleton
- `ContentModerationSkeletonList` - List of moderation card skeletons

**Usage:**
```tsx
import { ContentModerationSkeletonList } from '@/components/loading/ContentModerationSkeleton'

<ContentModerationSkeletonList count={3} />
```

### 6. TopLoadingBar (`TopLoadingBar.tsx`)
Global top loading bar for page navigation (uses NProgress).

**Features:**
- Automatic detection of route changes
- Birthday-themed gradient colors
- Smooth animations

**Usage:**
```tsx
// Already added to root layout (src/app/layout.tsx)
import { TopLoadingBar } from '@/components/loading/TopLoadingBar'

<TopLoadingBar />
```

### 7. LoadingWrapper (`LoadingWrapper.tsx`)
Generic wrapper component for conditional loading states.

**Usage:**
```tsx
import { LoadingWrapper } from '@/components/loading/LoadingWrapper'
import { ContentCardSkeletonGrid } from '@/components/loading/ContentCardSkeleton'

<LoadingWrapper
  isLoading={isLoading}
  fallback={<ContentCardSkeletonGrid count={6} />}
  message="Caricamento contenuti..."
>
  <YourContent />
</LoadingWrapper>
```

## Next.js Loading Pages

Loading pages automatically show while server components fetch data:

### Gallery Loading (`/app/(vip)/gallery/loading.tsx`)
Shows skeleton grid with filters while gallery data loads.

### Admin Users Loading (REMOVED)
**Note**: This page was removed after migration 004. User approval is now handled via email confirmation.
Shows user card skeletons while pending users are fetched.

### Admin Content Loading (`/app/(admin)/approve-content/loading.tsx`)
Shows content moderation skeletons while pending content is fetched.

## Integration Points

### 1. Gallery Page (`/components/gallery/GalleryView.tsx`)
- Shows `ContentCardSkeletonGrid` during client-side data fetching
- Server-side loading handled by `loading.tsx`

### 2. Upload Forms
All upload forms show spinner in submit button:
- `/components/upload/TextUpload.tsx` - Text upload with spinner
- `/components/upload/ImageUpload.tsx` - Image upload with progress bar and spinner
- `/components/upload/VideoUpload.tsx` - Video upload with progress bar and spinner

### 3. Admin Dashboards
All admin actions show spinner in buttons:
- `/components/admin/UserApprovalQueue.tsx` - Approve/Reject with spinners
- `/components/admin/ContentModerationQueue.tsx` - Approve/Reject with spinners

### 4. Global Navigation
Top loading bar shows during page transitions:
- Configured in `/app/layout.tsx`
- Custom styles in `/app/nprogress-styles.css`

## Design System

All loading components follow the birthday color theme:
- **Primary Gradient**: Pink (#FF69B4) → Purple (#9D4EDD) → Gold (#FFD700)
- **Animation**: Smooth pulse effect (tailwindcss-animate)
- **Timing**: 200-400ms transitions for responsive feel

## Best Practices

1. **Use skeleton screens** for initial page loads (better UX than spinners)
2. **Use spinners** for button actions and quick operations
3. **Show progress bars** for file uploads when progress is available
4. **Disable forms** during submission to prevent double-submit
5. **Maintain layout** - skeletons should match real content dimensions

## Performance Notes

- All skeleton components are lightweight (CSS-only animations)
- NProgress is configured with minimal bundle size impact
- Loading states prevent layout shift (CLS optimization)
- Spinners use CSS animations (hardware accelerated)

## Future Enhancements

Potential improvements for future iterations:
- [ ] Real upload progress tracking (currently simulated)
- [ ] Skeleton variants for different content types
- [ ] Staggered skeleton animations
- [ ] Loading state analytics (track loading times)
