"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { signIn, type SignInState } from "@/lib/auth-actions"

const initialState: SignInState = { error: null, email: "" }

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState)

  return (
    <form action={formAction} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            required
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state.error ? true : undefined}
          />
        </Field>
        <FieldError>{state.error}</FieldError>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Spinner />}
          Sign in
        </Button>
      </FieldGroup>
    </form>
  )
}
