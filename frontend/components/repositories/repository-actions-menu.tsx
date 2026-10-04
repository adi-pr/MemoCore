"use client"

import { Ellipsis, Pencil, Power, PowerOff } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeactivateRepositoryDialog } from "@/components/repositories/deactivate-repository-dialog"
import { EditRepositoryDialog } from "@/components/repositories/edit-repository-dialog"
import type { Repository } from "@/lib/api/types"
import { setRepositoryActive } from "@/lib/repository-actions"

export function RepositoryActionsMenu({
  repository,
}: {
  repository: Repository
}) {
  const [dialog, setDialog] = useState<"edit" | "deactivate" | null>(null)
  const [isReactivating, startReactivate] = useTransition()

  function reactivate() {
    startReactivate(async () => {
      await setRepositoryActive(repository.id, true)
    })
  }

  return (
    <>
      {/* Non-modal so focus moves cleanly into the dialogs it opens. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${repository.full_name}`}
            disabled={isReactivating}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <Pencil />
            Edit…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {repository.is_active ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDialog("deactivate")}
            >
              <PowerOff />
              Deactivate…
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={reactivate}>
              <Power />
              Reactivate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <EditRepositoryDialog
        repository={repository}
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
      />
      <DeactivateRepositoryDialog
        repository={repository}
        open={dialog === "deactivate"}
        onOpenChange={(open) => setDialog(open ? "deactivate" : null)}
      />
    </>
  )
}
