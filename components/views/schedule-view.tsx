import BorrowScheduleComponent from "@/components/borrow-schedule"
import type { BorrowSchedule } from "@/types/interfaces"
import { Calendar } from "lucide-react"

type ScanType = "handoff" | "return"
type QrType = "borrower" | "lender"

interface ScheduleViewProps {
  schedules: BorrowSchedule[]
  currentUserName: string
  onGenerateQR: (schedule: BorrowSchedule, type: QrType) => void
  onScanQR: (schedule: BorrowSchedule, type: ScanType) => void
  forceAllActions?: boolean
}

export function ScheduleView({
  schedules,
  currentUserName,
  onGenerateQR,
  onScanQR,
  forceAllActions = true,
}: ScheduleViewProps) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Calendar size={32} />
          Borrowing Schedule
        </h2>
      </div>
      <BorrowScheduleComponent
        schedules={schedules}
        currentUserName={currentUserName}
        onGenerateQR={onGenerateQR}
        onScanQR={onScanQR}
        forceAllActions={forceAllActions}
      />
    </>
  )
}
