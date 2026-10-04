import "server-only"

import { isOwner } from "@/lib/owner"
import { supabaseAdmin } from "@/lib/supabase/server"

const PAGE_SIZE = 1000

/** Whether the MemoCore account has been created. */
export async function hasAccount(): Promise<boolean> {
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    })

    if (error) {
      throw error
    }

    if (data.users.some(isOwner)) {
      return true
    }

    if (data.users.length < PAGE_SIZE) {
      return false
    }
  }
}
