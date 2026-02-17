import { Skeleton } from "@/components/ui/skeleton";

export function DoctorCardSkeleton() {
    return (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-16 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-20" />
        </div>
    )
}