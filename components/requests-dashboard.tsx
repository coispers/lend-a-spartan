"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, MessageSquare, User, X, Star } from "lucide-react"

type TabValue = "toRate" | "pending" | "approved" | "ongoing" | "completed" | "rejected"

const REQUESTS_TAB_STORAGE_PREFIX = "las:requestsTab:"
const ALLOWED_REQUEST_TABS: TabValue[] = ["toRate", "pending", "approved", "ongoing", "completed", "rejected"]

const getRequestsTabStorageKey = (role: "borrower" | "lender") => `${REQUESTS_TAB_STORAGE_PREFIX}${role}`

const readStoredRequestsTab = (role: "borrower" | "lender"): TabValue | null => {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(getRequestsTabStorageKey(role)) as TabValue | null
  return stored && ALLOWED_REQUEST_TABS.includes(stored) ? stored : null
}

interface BorrowRequest {
  id: string
  itemId: string
  itemTitle: string
  itemImage: string | null
  borrowerName: string
  borrowerRating: number
  borrowerId: string
  borrowerEmail: string
  requestDate: Date
  preferredDate: string
  returnDate: string | null
  meetingPlace: string | null
  meetingTime: string | null
  message: string
  status: "pending" | "approved" | "ongoing" | "rejected" | "completed"
  ownerId: string | null
  lenderName: string
  lenderEmail: string | null
  decisionMessage?: string | null
  borrowerFeedbackRating: number | null
  borrowerFeedbackMessage?: string | null
  borrowerFeedbackAt?: Date | null
  lenderFeedbackRating: number | null
  lenderFeedbackMessage?: string | null
  lenderFeedbackAt?: Date | null
}

interface RequestsDashboardProps {
  requests: BorrowRequest[]
  currentUserRole: "borrower" | "lender"
  onApprove: (requestId: string, responseMessage?: string) => void
  onReject: (requestId: string, responseMessage?: string) => void
  onComplete: (requestId: string) => void
  onOpenRating: (request: BorrowRequest, role: "borrower" | "lender") => void
}

export default function RequestsDashboard({
  requests,
  currentUserRole,
  onApprove,
  onReject,
  onComplete,
  onOpenRating,
}: RequestsDashboardProps) {
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null)
  const [decisionMessage, setDecisionMessage] = useState("")

  const getFirstName = (value?: string | null) => {
    if (!value) return ""
    const trimmed = value.trim()
    if (!trimmed) return ""
    return trimmed.split(/\s+/)[0]
  }

  const borrowerFirstName = selectedRequest ? getFirstName(selectedRequest.borrowerName) || "Borrower" : "Borrower"
  const lenderFirstName = selectedRequest ? getFirstName(selectedRequest.lenderName) || "Lender" : "Lender"
  const borrowerToLenderLabel = `${borrowerFirstName} (borrower) -> ${lenderFirstName} (lender)`
  const lenderToBorrowerLabel = `${lenderFirstName} (lender) -> ${borrowerFirstName} (borrower)`

  useEffect(() => {
    if (!selectedRequest) {
      setDecisionMessage("")
      return
    }
    setDecisionMessage(selectedRequest.decisionMessage ?? "")
  }, [selectedRequest])

  const isAwaitingFeedback = (request: BorrowRequest) =>
    request.status === "completed" &&
    (currentUserRole === "borrower" ? !request.borrowerFeedbackRating : !request.lenderFeedbackRating)

  const toRateRequests = useMemo(() => requests.filter((req) => isAwaitingFeedback(req)), [requests, currentUserRole])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "ongoing":
        return "bg-indigo-100 text-indigo-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} />
      case "ongoing":
        return <Clock size={16} />
      case "rejected":
        return <XCircle size={16} />
      case "completed":
        return <CheckCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const approvedRequests = requests.filter((r) => r.status === "approved")
  const ongoingRequests = requests.filter((r) => r.status === "ongoing")
  const completedRequests = requests.filter((r) => r.status === "completed")
  const rejectedRequests = requests.filter((r) => r.status === "rejected")

  const computeFallbackTab = useCallback((): TabValue => {
    if (toRateRequests.length > 0) return "toRate"
    if (pendingRequests.length > 0) return "pending"
    if (approvedRequests.length > 0) return "approved"
    if (ongoingRequests.length > 0) return "ongoing"
    if (completedRequests.length > 0) return "completed"
    return "rejected"
  }, [
    toRateRequests.length,
    pendingRequests.length,
    approvedRequests.length,
    ongoingRequests.length,
    completedRequests.length,
  ])

  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const stored = readStoredRequestsTab(currentUserRole)
    return stored ?? computeFallbackTab()
  })

  useEffect(() => {
    const stored = readStoredRequestsTab(currentUserRole)
    if (stored) {
      setActiveTab((prev) => (prev === stored ? prev : stored))
      return
    }
    const fallback = computeFallbackTab()
    setActiveTab((prev) => (prev === fallback ? prev : fallback))
  }, [currentUserRole, computeFallbackTab])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(getRequestsTabStorageKey(currentUserRole), activeTab)
  }, [activeTab, currentUserRole])

  const renderStars = (value: number) => (
    <div className="flex gap-1 text-accent">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={16} className={star <= value ? "fill-accent text-accent" : "text-muted-foreground"} />
      ))}
    </div>
  )

  const formatDate = (value?: Date | null) => (value ? value.toLocaleDateString() : null)

  const renderFeedbackBlock = (
    rating: number | null,
    message: string | null | undefined,
    timestamp: Date | null | undefined,
    emptyLabel: string,
  ) => {
    if (!rating) {
      return <p className="text-muted-foreground">{emptyLabel}</p>
    }
    const formatted = formatDate(timestamp)
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {renderStars(rating)}
          {formatted && <span className="text-xs text-muted-foreground">{formatted}</span>}
        </div>
        {message && <p className="text-sm text-foreground break-words">{message}</p>}
      </div>
    )
  }

  const RequestCard = ({ request }: { request: BorrowRequest }) => {
    const showRateButton = isAwaitingFeedback(request)

    return (
    <Card
      className="p-3 md:p-4 border border-border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedRequest(request)}
    >
      <div className="flex gap-3 md:gap-4">
        <img
          src={request.itemImage || "/placeholder.svg"}
          alt={request.itemTitle}
          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{request.itemTitle}</h3>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {currentUserRole === "lender" ? `From: ${request.borrowerName}` : `To: ${request.lenderName}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${getStatusColor(request.status)} text-xs flex-shrink-0`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(request.status)}
                  <span className="hidden sm:inline">
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </span>
              </Badge>
              {showRateButton && (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenRating(request, currentUserRole)
                  }}
                >
                  Rate now
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Requested: {new Date(request.requestDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">Preferred: {request.preferredDate}</p>
        </div>
      </div>
    </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
          <TabsTrigger value="toRate" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">To Rate</span>
            <span className="sm:hidden">R</span> ({toRateRequests.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">P</span> ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Approved</span>
            <span className="sm:hidden">A</span> ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Ongoing</span>
            <span className="sm:hidden">O</span> ({ongoingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">C</span> ({completedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Rejected</span>
            <span className="sm:hidden">R</span> ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toRate" className="space-y-2 md:space-y-3 mt-3 md:mt-4">
          {toRateRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8">Nothing waiting for your feedback.</p>
          ) : (
            toRateRequests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-2 md:space-y-3 mt-3 md:mt-4">
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8">No pending requests</p>
          ) : (
            pendingRequests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-2 md:space-y-3 mt-3 md:mt-4">
          {approvedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8">No approved requests</p>
          ) : (
            approvedRequests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="ongoing" className="space-y-2 md:space-y-3 mt-3 md:mt-4">
          {ongoingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8">No ongoing requests</p>
          ) : (
            ongoingRequests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-2 md:space-y-3 mt-3 md:mt-4">
          {completedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8">No completed requests</p>
          ) : (
            completedRequests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-2 md:space-y-3 mt-3 md:mt-4">
          {rejectedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8">No rejected requests</p>
          ) : (
            rejectedRequests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-4 md:p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg md:text-2xl font-bold text-foreground flex-1 break-words">
                  {selectedRequest.itemTitle}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X size={18} />
                </Button>
              </div>

              <img
                src={selectedRequest.itemImage || "/placeholder.svg"}
                alt={selectedRequest.itemTitle}
                className="w-full h-40 object-cover rounded"
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {currentUserRole === "lender" ? "Borrower" : "Lender"}
                    </p>
                    <p className="font-semibold text-sm truncate">
                      {currentUserRole === "lender" ? selectedRequest.borrowerName : selectedRequest.lenderName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Date</p>
                    <p className="font-semibold text-sm">{selectedRequest.preferredDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MessageSquare size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Message</p>
                    <p className="text-sm break-words">{selectedRequest.message || "No message provided"}</p>
                  </div>
                </div>

                {selectedRequest.status !== "pending" && selectedRequest.decisionMessage && (
                  <div className="flex items-start gap-2">
                    <MessageSquare size={18} className="text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {selectedRequest.status === "rejected" ? "Lender Reason" : "Lender Message"}
                      </p>
                      <p className="text-sm break-words">{selectedRequest.decisionMessage}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "completed" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{borrowerToLenderLabel}</p>
                      {renderFeedbackBlock(
                        selectedRequest.borrowerFeedbackRating,
                        selectedRequest.borrowerFeedbackMessage,
                        selectedRequest.borrowerFeedbackAt,
                        "Awaiting borrower feedback.",
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{lenderToBorrowerLabel}</p>
                      {renderFeedbackBlock(
                        selectedRequest.lenderFeedbackRating,
                        selectedRequest.lenderFeedbackMessage,
                        selectedRequest.lenderFeedbackAt,
                        "Awaiting lender feedback.",
                      )}
                    </div>
                  </div>

                  {isAwaitingFeedback(selectedRequest) && (
                    <Button
                      onClick={() => {
                        onOpenRating(selectedRequest, currentUserRole)
                        setSelectedRequest(null)
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-10"
                    >
                      Rate {currentUserRole === "borrower" ? selectedRequest.lenderName : selectedRequest.borrowerName}
                    </Button>
                  )}
                </div>
              )}

              {currentUserRole === "lender" && selectedRequest.status === "pending" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Message to borrower (optional)
                  </label>
                  <textarea
                    value={decisionMessage}
                    onChange={(event) => setDecisionMessage(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    rows={3}
                    placeholder="Let the borrower know why you approved or rejected the request..."
                  />
                </div>
              )}

              {currentUserRole === "lender" && selectedRequest.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      const trimmed = decisionMessage.trim()
                      onApprove(selectedRequest.id, trimmed ? trimmed : undefined)
                      setSelectedRequest(null)
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-10"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      const trimmed = decisionMessage.trim()
                      onReject(selectedRequest.id, trimmed ? trimmed : undefined)
                      setSelectedRequest(null)
                    }}
                    variant="outline"
                    className="flex-1 text-sm h-10"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {currentUserRole === "lender" && selectedRequest.status === "ongoing" && (
                <Button
                  onClick={() => {
                    onComplete(selectedRequest.id)
                    setSelectedRequest(null)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-10"
                >
                  Mark as Completed
                </Button>
              )}

              <Button onClick={() => setSelectedRequest(null)} variant="outline" className="w-full text-sm h-10">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
