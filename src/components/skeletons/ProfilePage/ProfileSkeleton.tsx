import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Skeleton */}
      <Card className="mb-8 border-0 shadow-xl overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-background">
          <Skeleton className="w-full h-full" />
        </div>
        <CardContent className="relative -mt-24 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <Skeleton className="w-40 h-40 rounded-2xl" />
            <div className="flex-1 space-y-3 text-center md:text-left">
              <Skeleton className="h-10 w-64 mx-auto md:mx-0" />
              <Skeleton className="h-6 w-48 mx-auto md:mx-0" />
              <div className="flex gap-3 justify-center md:justify-start">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Content Skeleton */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  </div>
)
