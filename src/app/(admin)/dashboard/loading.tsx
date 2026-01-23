export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted rounded-md animate-pulse mb-2" />
          <div className="h-5 w-[600px] bg-muted rounded-md animate-pulse" />
        </div>

        <div className="space-y-6">
          {/* Storage Monitor Skeleton */}
          <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />
          
          {/* Stats Cards Skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-48 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
