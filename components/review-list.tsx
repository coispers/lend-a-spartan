"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  review: string
  reviewer: string
  date: Date
  itemTitle: string
}

interface ReviewListProps {
  reviews: Review[]
  title?: string
}

export default function ReviewList({ reviews, title = "Reviews" }: ReviewListProps) {
  const averageRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(Number.parseFloat(averageRating as string))
                      ? "fill-accent text-accent"
                      : "text-muted-foreground"
                  }
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{averageRating}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card className="p-6 text-center border border-border">
          <p className="text-muted-foreground">No reviews yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4 border border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">{review.reviewer}</p>
                  <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-accent text-accent" />
                  ))}
                </Badge>
              </div>
              {review.review && <p className="text-sm text-foreground">{review.review}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
