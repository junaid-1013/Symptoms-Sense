import { Skeleton } from "@/components/ui/skeleton"

export function TestimonialSkeleton() {
    return (
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
    )
}