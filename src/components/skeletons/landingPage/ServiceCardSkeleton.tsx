import { Skeleton } from "@/components/ui/skeleton"

export function ServiceCardSkeleton() {
    return (
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            <div className="flex flex-col items-center text-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
    )
}