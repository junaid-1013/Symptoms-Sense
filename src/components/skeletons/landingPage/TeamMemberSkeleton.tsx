import { Skeleton } from "@/components/ui/skeleton";

export function TeamMemberSkeleton() {
    return (
        <div className="text-center">
            <Skeleton className="h-48 w-48 rounded-2xl mx-auto mb-4" />
            <Skeleton className="h-5 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
        </div>
    )
}