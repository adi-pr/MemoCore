"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { completeSetup, type SetupState } from "@/lib/auth-actions"

const initialState: SetupState = {
  fieldErrors: {},
  formError: null,
  values: { name: "", email: "" },
}

export function SetupForm() {
  const [state, formAction, isPending] = useActionState(
    completeSetup,
    initialState,
  )
  const { fieldErrors } = state

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={fieldErrors.name ? true : undefined}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={state.values.name}
            aria-invalid={fieldErrors.name ? true : undefined}
            required
            autoFocus
          />
          <FieldError>{fieldErrors.name}</FieldError>
        </Field>
        <Field data-invalid={fieldErrors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.values.email}
            aria-invalid={fieldErrors.email ? true : undefined}
            required
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>
        <Field data-invalid={fieldErrors.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby="password-hint"
            required
          />
          <FieldDescription id="password-hint">
            At least 8 characters.
          </FieldDescription>
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>
        <Field data-invalid={fieldErrors.confirmPassword ? true : undefined}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={fieldErrors.confirmPassword ? true : undefined}
            required
          />
          <FieldError>{fieldErrors.confirmPassword}</FieldError>
        </Field>
        <FieldError>{state.formError}</FieldError>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Spinner />}
          Create account
        </Button>
      </FieldGroup>
    </form>
  )
}
