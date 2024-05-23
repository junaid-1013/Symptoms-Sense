import { Button } from "@/components/ui/button"
import { EmptyStateProps } from "@/types"
import { Plus } from "lucide-react"
import Link from "next/link"

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="p-4 bg-muted/50 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
    {actionLabel && actionHref && (
      <Link href={actionHref}>
        <Button size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          {actionLabel}
        </Button>
      </Link>
    )}
  </div>
)