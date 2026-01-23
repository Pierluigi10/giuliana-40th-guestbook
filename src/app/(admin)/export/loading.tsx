import { LoadingWrapper } from '@/components/loading/LoadingWrapper'

export default function ExportLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-6 w-96 bg-muted animate-pulse rounded" />
        </div>
        <LoadingWrapper />
      </div>
    </div>
  )
}
