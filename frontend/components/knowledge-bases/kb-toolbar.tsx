import { RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function KbToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search knowledge bases..." className="pl-8" />
      </div>

      <Select defaultValue="updated">
        <SelectTrigger className="w-[190px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="updated">Recently Updated</SelectItem>
          <SelectItem value="created">Recently Created</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" size="icon" aria-label="Refresh">
        <RefreshCw className="size-4" />
      </Button>
    </div>
  )
}
