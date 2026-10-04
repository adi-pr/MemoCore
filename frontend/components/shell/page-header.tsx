import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type PageHeaderProps = {
  title: string
  /** Controls shown on the right, like a primary action. */
  actions?: React.ReactNode
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <h1 className="text-sm font-medium">{title}</h1>
      {actions && (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      )}
    </header>
  )
}
