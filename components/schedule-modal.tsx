"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Calendar, MapPin, Clock } from "lucide-react"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  itemTitle: string
  borrowerName: string
  onSubmit: (data: {
    startDate: string
    endDate: string
    meetingPlace: string
    meetingTime: string
  }) => void
  defaults?: {
    startDate?: string
    endDate?: string
    meetingPlace?: string
    meetingTime?: string
  }
}

export default function ScheduleModal({ isOpen, onClose, itemTitle, borrowerName, onSubmit, defaults }: ScheduleModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [meetingPlace, setMeetingPlace] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setStartDate(defaults?.startDate ?? "")
      setEndDate(defaults?.endDate ?? "")
      setMeetingPlace(defaults?.meetingPlace ?? "")
      setMeetingTime(defaults?.meetingTime ?? "")
    }
  }, [defaults, isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    setError("")

    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("End date must be on or after the start date")
      return
    }

    if (!meetingPlace.trim()) {
      setError("Please provide a meeting place")
      return
    }

    if (!meetingTime) {
      setError("Please select a meeting time")
      return
    }

    onSubmit({
      startDate,
      endDate,
      meetingPlace: meetingPlace.trim(),
      meetingTime,
    })
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Meeting Place
              </label>
              <Input
                type="text"
                value={meetingPlace}
                onChange={(e) => setMeetingPlace(e.target.value)}
                placeholder="e.g. Library Atrium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock size={16} />
                Meeting Time
              </label>
              <Input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
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
