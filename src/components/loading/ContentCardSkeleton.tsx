'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function ContentCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-birthday-pink/20 to-birthday-purple/20 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        <Skeleton className="w-full h-[200px] rounded-lg" />
      </div>

      {/* Reactions Skeleton */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

interface ContentCardSkeletonGridProps {
  count?: number
}

export function ContentCardSkeletonGrid({ count = 6 }: ContentCardSkeletonGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="break-inside-avoid">
          <ContentCardSkeleton />
        </div>
      ))}
    </div>
  )
}
