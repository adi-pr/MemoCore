import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RepositoryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      role="status"
      aria-label="Loading repositories"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} aria-hidden>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
