"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { Repository } from "@/lib/api/types"
import {
  updateRepository,
  type EditRepositoryState,
} from "@/lib/repository-actions"

const initialState: EditRepositoryState = {
  status: "idle",
  fieldErrors: {},
  formError: null,
}

type EditRepositoryDialogProps = {
  repository: Repository
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRepositoryDialog({
  repository,
  open,
  onOpenChange,
}: EditRepositoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {repository.full_name}</DialogTitle>
          <DialogDescription>
            The name is how MemoCore labels this repository.
          </DialogDescription>
        </DialogHeader>
        <EditRepositoryForm
          repository={repository}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function EditRepositoryForm({
  repository,
  onSaved,
}: {
  repository: Repository
  onSaved: () => void
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: EditRepositoryState, formData: FormData) => {
      const result = await updateRepository(repository.id, previous, formData)
      if (result.status === "success") onSaved()
      return result
    },
    initialState,
  )
  const { fieldErrors } = state

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={fieldErrors.name ? true : undefined}>
          <FieldLabel htmlFor="edit-name">Name</FieldLabel>
          <Input
            id="edit-name"
            name="name"
            defaultValue={repository.name}
            autoComplete="off"
            aria-invalid={fieldErrors.name ? true : undefined}
            required
          />
          <FieldError>{fieldErrors.name}</FieldError>
        </Field>
        <Field data-invalid={fieldErrors.branch ? true : undefined}>
          <FieldLabel htmlFor="edit-branch">Branch</FieldLabel>
          <Input
            id="edit-branch"
            name="branch"
            defaultValue={repository.default_branch}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={fieldErrors.branch ? true : undefined}
            aria-describedby="edit-branch-hint"
            required
          />
          <FieldDescription id="edit-branch-hint">
            A new branch is indexed on the next sync.
          </FieldDescription>
          <FieldError>{fieldErrors.branch}</FieldError>
        </Field>
        <FieldError>{state.formError}</FieldError>
      </FieldGroup>
      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
