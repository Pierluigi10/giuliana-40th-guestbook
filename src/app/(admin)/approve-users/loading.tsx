import { UserCardSkeletonList } from '@/components/loading/UserCardSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted rounded-md animate-pulse mb-2" />
          <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
        </div>

        <UserCardSkeletonList count={5} />
      </div>
    </div>
  )
}
