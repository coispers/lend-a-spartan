import { Button } from "@/components/ui/button"
import RequestsDashboard from "@/components/requests-dashboard"
import type { BorrowRequest } from "@/types/interfaces"
import { Inbox } from "lucide-react"

interface RequestsViewProps {
  requestsView: "borrower" | "lender"
  onRequestsViewChange: (view: "borrower" | "lender") => void
  borrowerRequests: BorrowRequest[]
  lenderRequests: BorrowRequest[]
  onApprove: (requestId: string, responseMessage?: string) => void
  onReject: (requestId: string, responseMessage?: string) => void
  onComplete: (requestId: string) => void
  onOpenRating: (request: BorrowRequest, role: "borrower" | "lender") => void
}

export function RequestsView({
  requestsView,
  onRequestsViewChange,
  borrowerRequests,
  lenderRequests,
  onApprove,
  onReject,
  onComplete,
  onOpenRating,
}: RequestsViewProps) {
  const isBorrowerView = requestsView === "borrower"
  const description = isBorrowerView
    ? "Track the items you've asked to borrow and monitor their status."
    : "Review incoming requests for your listed items and respond quickly to keep things moving."

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Inbox size={32} />
            Requests Center
          </h2>
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
            <Button
              type="button"
              size="sm"
              variant={isBorrowerView ? "default" : "ghost"}
              className="text-sm"
              onClick={() => onRequestsViewChange("borrower")}
            >
              As Borrower
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isBorrowerView ? "default" : "ghost"}
              className="text-sm"
              onClick={() => onRequestsViewChange("lender")}
            >
              As Lender
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <RequestsDashboard
        requests={isBorrowerView ? borrowerRequests : lenderRequests}
        currentUserRole={requestsView}
        onApprove={onApprove}
        onReject={onReject}
        onComplete={onComplete}
        onOpenRating={onOpenRating}
      />
    </>
  )
}
