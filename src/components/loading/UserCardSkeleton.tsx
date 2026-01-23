'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function UserCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 flex items-center justify-between">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-3 w-56" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

interface UserCardSkeletonListProps {
  count?: number
}

export function UserCardSkeletonList({ count = 3 }: UserCardSkeletonListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <UserCardSkeleton key={index} />
      ))}
    </div>
  )
}
