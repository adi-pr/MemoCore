"use client"

import { Plus } from "lucide-react"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { parseGitHubRepository } from "@/lib/github"
import {
  addRepository,
  type AddRepositoryState,
} from "@/lib/repository-actions"

const initialState: AddRepositoryState = {
  status: "idle",
  fieldErrors: {},
  formError: null,
  values: { repository: "", branch: "main" },
}

export function AddRepositoryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Add repository
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add repository</DialogTitle>
          <DialogDescription>
            MemoCore indexes the Markdown files on the branch you choose.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts fresh every time. */}
        <AddRepositoryForm onAdded={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddRepositoryForm({ onAdded }: { onAdded: () => void }) {
  const [repository, setRepository] = useState("")
  const [state, formAction, isPending] = useActionState(
    async (previous: AddRepositoryState, formData: FormData) => {
      const result = await addRepository(previous, formData)
      if (result.status === "success") onAdded()
      return result
    },
    initialState,
  )
  const { fieldErrors } = state
  const parsed = parseGitHubRepository(repository)

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={fieldErrors.repository ? true : undefined}>
          <FieldLabel htmlFor="repository">GitHub repository</FieldLabel>
          <Input
            id="repository"
            name="repository"
            placeholder="https://github.com/me/wiki"
            autoComplete="off"
            spellCheck={false}
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            aria-invalid={fieldErrors.repository ? true : undefined}
            aria-describedby="repository-hint"
            required
            autoFocus
          />
          <FieldDescription id="repository-hint" aria-live="polite">
            {parsed
              ? `Adds ${parsed.fullName}`
              : "A repository URL or owner/repo."}
          </FieldDescription>
          <FieldError>{fieldErrors.repository}</FieldError>
        </Field>
        <Field data-invalid={fieldErrors.branch ? true : undefined}>
          <FieldLabel htmlFor="branch">Branch</FieldLabel>
          <Input
            id="branch"
            name="branch"
            defaultValue={state.values.branch}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={fieldErrors.branch ? true : undefined}
          />
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
          Add repository
        </Button>
      </DialogFooter>
    </form>
  )
}
