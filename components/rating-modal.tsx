"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Star } from "lucide-react"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  itemTitle: string
  onSubmit: (data: { rating: number; review: string }) => void
}

export default function RatingModal({ isOpen, onClose, userName, itemTitle, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating")
      return
    }
    onSubmit({ rating, review })
    setRating(0)
    setReview("")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-foreground">Rate Transaction</h2>
        <p className="text-muted-foreground mb-1">{itemTitle}</p>
        <p className="text-sm text-muted-foreground mb-6">with {userName}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">Rating</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= (hoverRating || rating) ? "fill-accent text-accent" : "text-muted-foreground"}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select a rating"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Submit Rating
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
