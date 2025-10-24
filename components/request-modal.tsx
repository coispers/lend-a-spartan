"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Calendar, MessageSquare } from "lucide-react"

interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
  onSubmit: (data: any) => void
}

export default function RequestModal({ isOpen, onClose, item, onSubmit }: RequestModalProps) {
  const [date, setDate] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !item) return null

  const handleSubmit = () => {
    if (!date) {
      alert("Please select a date")
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit({ date, message })
      setDate("")
      setMessage("")
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-foreground">Request to Borrow</h2>
        <p className="text-muted-foreground mb-6">{item.title}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Preferred Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-border"
              disabled={isSubmitting}
            />
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
