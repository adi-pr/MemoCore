import { AlertTriangle, RotateCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface KbErrorStateProps {
  onRetry: () => void
}

export function KbErrorState({ onRetry }: KbErrorStateProps) {
  return (
    <Alert variant="destructive" className="items-start gap-3 p-5 sm:p-6">
      <AlertTriangle className="size-5" />
      <div className="flex flex-col items-start gap-2">
        <AlertTitle className="text-base">Unable to load knowledge bases</AlertTitle>
        <AlertDescription>
          Something went wrong while retrieving your knowledge bases.
        </AlertDescription>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 gap-1.5"
          onClick={onRetry}
        >
          <RotateCw className="size-3.5" />
          Retry
        </Button>
      </div>
    </Alert>
  )
}
