"use client"

import { useState, useTransition } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { Repository } from "@/lib/api/types"
import { setRepositoryActive } from "@/lib/repository-actions"

type DeactivateRepositoryDialogProps = {
  repository: Repository
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateRepositoryDialog({
  repository,
  open,
  onOpenChange,
}: DeactivateRepositoryDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function changeOpen(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  function deactivate() {
    startTransition(async () => {
      const result = await setRepositoryActive(repository.id, false)

      if (result.error) {
        setError(result.error)
      } else {
        changeOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Deactivate {repository.full_name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            It stops syncing and its documents no longer appear in search or
            chat. The indexed data is kept, so you can reactivate it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {/* A plain button, so the dialog stays open until the request finishes. */}
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={deactivate}
          >
            {isPending && <Spinner />}
            Deactivate
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
