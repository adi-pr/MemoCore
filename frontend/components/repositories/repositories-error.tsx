"use client"

import { CircleAlert, RotateCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

export function RepositoriesError({ message }: { message: string }) {
  const router = useRouter()
  const [isRetrying, startTransition] = useTransition()

  return (
    <Empty role="alert">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>Couldn&apos;t load repositories</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          disabled={isRetrying}
          onClick={() => startTransition(() => router.refresh())}
        >
          {isRetrying ? <Spinner /> : <RotateCw />}
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
