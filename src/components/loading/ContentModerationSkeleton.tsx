'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function ContentModerationSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Content Preview Skeleton */}
        <div className="mb-4">
          <Skeleton className="w-full h-[300px] rounded-lg" />
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-md" />
          <Skeleton className="flex-1 h-12 rounded-md" />
        </div>
      </div>
    </div>
  )
}

interface ContentModerationSkeletonListProps {
  count?: number
}

export function ContentModerationSkeletonList({ count = 3 }: ContentModerationSkeletonListProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ContentModerationSkeleton key={index} />
      ))}
    </div>
  )
}
