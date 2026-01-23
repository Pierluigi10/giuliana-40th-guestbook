import { ContentModerationSkeletonList } from '@/components/loading/ContentModerationSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted rounded-md animate-pulse mb-2" />
          <div className="h-5 w-[600px] bg-muted rounded-md animate-pulse" />
        </div>

        <ContentModerationSkeletonList count={3} />
      </div>
    </div>
  )
}
