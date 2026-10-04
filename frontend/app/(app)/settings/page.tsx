import type { Metadata } from "next"
import { Settings } from "lucide-react"

import { PageHeader } from "@/components/shell/page-header"
import { PagePlaceholder } from "@/components/shell/page-placeholder"

export const metadata: Metadata = { title: "Settings · MemoCore" }

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <PagePlaceholder
        icon={Settings}
        title="Settings"
        description="Nothing to configure yet."
      />
    </>
  )
}
