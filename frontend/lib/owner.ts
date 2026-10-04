import type { User } from "@supabase/supabase-js"

/**
 * app_metadata flag marking the one MemoCore account. Users can't edit
 * app_metadata, so other accounts on the same Supabase can't sign in.
 */
export const OWNER_FLAG = "memocore_owner"

export function isOwner(user: User | null | undefined): user is User {
  return user?.app_metadata?.[OWNER_FLAG] === true
}
