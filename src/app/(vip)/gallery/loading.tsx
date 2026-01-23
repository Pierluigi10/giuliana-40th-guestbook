import { ContentCardSkeletonGrid } from '@/components/loading/ContentCardSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-pink/5 via-birthday-purple/5 to-birthday-gold/5">
      <div className="container mx-auto py-8 px-4">
        {/* Header Skeleton */}
        <div className="mb-8 text-center">
          <Skeleton className="h-12 w-[500px] mx-auto mb-3" />
          <Skeleton className="h-6 w-[400px] mx-auto" />
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap justify-center gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-32 rounded-full" />
            ))}
          </div>
          <div className="text-center mt-4">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <ContentCardSkeletonGrid count={9} />
      </div>
    </div>
  )
}
