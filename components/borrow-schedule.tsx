"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertCircle, QrCode } from "lucide-react"

interface BorrowSchedule {
  id: string
  itemId: number
  itemTitle: string
  borrowerName: string
  borrowerQRCode: string
  startDate: string
  endDate: string
  status: "scheduled" | "active" | "item_given" | "overdue" | "completed"
  qrCode: string
}

interface BorrowScheduleProps {
  schedules: BorrowSchedule[]
  onGenerateQR: (schedule: BorrowSchedule) => void
  onScanQR: (schedule: BorrowSchedule, scanType: "handoff" | "return") => void
}

export default function BorrowScheduleComponent({ schedules, onGenerateQR, onScanQR }: BorrowScheduleProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "item_given":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "overdue") return <AlertCircle size={16} />
    return <Clock size={16} />
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "item_given":
        return "Item Given"
      case "active":
        return "Active"
      case "overdue":
        return "Overdue"
      case "completed":
        return "Completed"
      default:
        return "Scheduled"
    }
  }

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-2 md:space-y-4">
      {schedules.length === 0 ? (
        <Card className="p-6 md:p-8 text-center border border-border">
          <p className="text-muted-foreground">No scheduled borrowings</p>
        </Card>
      ) : (
        schedules.map((schedule) => {
          const daysRemaining = calculateDaysRemaining(schedule.endDate)
          const isOverdue = daysRemaining < 0 && schedule.status !== "completed"

          return (
            <Card key={schedule.id} className="p-3 md:p-4 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{schedule.itemTitle}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Borrower: {schedule.borrowerName}</p>
                </div>
                <Badge className={`${getStatusColor(isOverdue ? "overdue" : schedule.status)} text-xs flex-shrink-0`}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(isOverdue ? "overdue" : schedule.status)}
                    <span className="hidden sm:inline">{getStatusLabel(isOverdue ? "overdue" : schedule.status)}</span>
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="md:w-4 md:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Start</p>
                    <p className="text-xs md:text-sm font-medium">
                      {new Date(schedule.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="md:w-4 md:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">End</p>
                    <p className="text-xs md:text-sm font-medium">{new Date(schedule.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {schedule.status !== "completed" && (
                <div className="mb-3 p-2 bg-muted rounded text-xs md:text-sm">
                  <p className="text-foreground">
                    {isOverdue ? (
                      <span className="text-red-600 font-semibold">{Math.abs(daysRemaining)} days overdue</span>
                    ) : (
                      <span>{daysRemaining} days remaining</span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => onGenerateQR(schedule)}
                  variant="outline"
                  className="flex-1 text-xs md:text-sm h-9 md:h-auto"
                >
                  QR Code
                </Button>
                {schedule.status === "active" && (
                  <Button
                    onClick={() => onScanQR(schedule, "handoff")}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-sm h-9 md:h-auto flex items-center justify-center gap-1"
                  >
                    <QrCode size={16} />
                    <span className="hidden sm:inline">Give Item</span>
                    <span className="sm:hidden">Give</span>
                  </Button>
                )}
                {schedule.status === "item_given" && (
                  <Button
                    onClick={() => onScanQR(schedule, "return")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm h-9 md:h-auto flex items-center justify-center gap-1"
                  >
                    <QrCode size={16} />
                    <span className="hidden sm:inline">Receive Item</span>
                    <span className="sm:hidden">Receive</span>
                  </Button>
                )}
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
