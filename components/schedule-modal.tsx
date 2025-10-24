"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Calendar } from "lucide-react"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  itemTitle: string
  borrowerName: string
  onSubmit: (data: { startDate: string; endDate: string }) => void
}

export default function ScheduleModal({ isOpen, onClose, itemTitle, borrowerName, onSubmit }: ScheduleModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    setError("")

    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date")
      return
    }

    onSubmit({ startDate, endDate })
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-foreground">Schedule Borrowing</h2>
        <p className="text-muted-foreground mb-2">{itemTitle}</p>
        <p className="text-sm text-muted-foreground mb-6">Borrower: {borrowerName}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar size={16} />
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border"
            />
          </div>

          {error && <div className="p-3 bg-red-100 text-red-800 rounded text-sm">{error}</div>}

          <div className="space-y-2">
            <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Create Schedule
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
