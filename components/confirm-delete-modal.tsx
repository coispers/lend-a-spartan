"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, X } from "lucide-react"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  itemTitle?: string
  onCancel: () => void
  onConfirm: () => void
  isLoading?: boolean
  errorMessage?: string | null
}

export default function ConfirmDeleteModal({
  isOpen,
  itemTitle,
  onCancel,
  onConfirm,
  isLoading = false,
  errorMessage,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="relative w-full max-w-md border border-border p-6 shadow-lg">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
          disabled={isLoading}
        >
          <X size={20} />
          <span className="sr-only">Close delete confirmation</span>
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Delete listing?</h2>
            <p className="text-sm text-muted-foreground">
              {itemTitle ? (
                <>
                  This will remove <span className="font-medium text-foreground">{itemTitle}</span> from the available listings
                  for everyone. You can&apos;t undo this action.
                </>
              ) : (
                "This will remove the selected listing for everyone."
              )}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="sm:min-w-[120px]"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="sm:min-w-[140px]"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete listing"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
