import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KbListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="gap-4 p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>

          <Skeleton className="h-px w-full" />

          <div className="flex flex-wrap gap-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-28" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  )
}
