"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, MessageSquare, User, X } from "lucide-react"

interface BorrowRequest {
  id: string
  itemId: number
  itemTitle: string
  itemImage: string
  borrowerName: string
  borrowerRating: number
  requestDate: Date
  preferredDate: string
  message: string
  status: "pending" | "approved" | "rejected" | "completed"
  lenderName: string
  lenderEmail: string
}

interface RequestsDashboardProps {
  requests: BorrowRequest[]
  currentUserRole: "borrower" | "lender"
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
  onComplete: (requestId: string) => void
}

export default function RequestsDashboard({
  requests,
  currentUserRole,
  onApprove,
  onReject,
  onComplete,
}: RequestsDashboardProps) {
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
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
  const completedRequests = requests.filter((r) => r.status === "completed")
  const rejectedRequests = requests.filter((r) => r.status === "rejected")

  const RequestCard = ({ request }: { request: BorrowRequest }) => (
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
            <Badge className={`${getStatusColor(request.status)} text-xs flex-shrink-0`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(request.status)}
                <span className="hidden sm:inline">
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Requested: {new Date(request.requestDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">Preferred: {request.preferredDate}</p>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="pending" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">P</span> ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs md:text-sm py-2">
            <span className="hidden sm:inline">Approved</span>
            <span className="sm:hidden">A</span> ({approvedRequests.length})
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
              </div>

              {currentUserRole === "lender" && selectedRequest.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      onApprove(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-10"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      onReject(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    variant="outline"
                    className="flex-1 text-sm h-10"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {currentUserRole === "lender" && selectedRequest.status === "approved" && (
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
