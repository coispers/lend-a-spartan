"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Calendar, MessageSquare, Clock, MapPin } from "lucide-react"
interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
  onSubmit: (data: {
    preferredDate: string
    returnDate: string
    meetingPlace: string
    meetingTime: string
    message: string
  }) => Promise<boolean> | boolean
  errorMessage?: string | null
}

export default function RequestModal({ isOpen, onClose, item, onSubmit, errorMessage }: RequestModalProps) {
  const [preferredDate, setPreferredDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [meetingPlace, setMeetingPlace] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPreferredDate("")
      setReturnDate("")
      setMeetingPlace("")
      setMeetingTime("")
      setMessage("")
    }
  }, [isOpen])

  if (!isOpen || !item) return null

  const handleSubmit = async () => {
    if (!preferredDate) {
      alert("Please select a preferred start date")
      return
    }
    if (!returnDate) {
      alert("Please select a return date")
      return
    }
    if (new Date(returnDate) < new Date(preferredDate)) {
      alert("Return date must be on or after the preferred start date")
      return
    }
    if (!meetingPlace.trim()) {
      alert("Please provide a meeting place")
      return
    }
    if (!meetingTime) {
      alert("Please choose a meeting time")
      return
    }
    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        preferredDate,
        returnDate,
        meetingPlace: meetingPlace.trim(),
        meetingTime,
        message,
      })
      if (result) {
        setPreferredDate("")
        setReturnDate("")
        setMeetingPlace("")
        setMeetingTime("")
        setMessage("")
      }
    } catch (error) {
      console.error("Failed to submit borrow request", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-foreground">Request to Borrow</h2>
        <p className="text-muted-foreground mb-6">{item.title}</p>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Preferred Start Date
              </label>
              <Input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="border border-border"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Return Date
              </label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="border border-border"
                disabled={isSubmitting}
                min={preferredDate || undefined}
              />
            </div>
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
                className="border border-border"
                disabled={isSubmitting}
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
                className="border border-border"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare size={16} />
              Message to Lender
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the lender about your needs..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full bg-transparent" disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
