"use client"

import { Card } from "@/components/ui/card"
import { Star, CheckCircle, AlertCircle } from "lucide-react"

interface UserReview {
  id: string
  rating: number
  review: string
  reviewer: string
  date: Date
  itemTitle: string
}

interface UserProfileProps {
  userName: string
  rating: number | null
  totalReviews: number
  itemsLent: number
  itemsBorrowed: number
  joinDate: Date
  reviews: UserReview[]
  lenderRating: number | null
  lenderReviewCount: number
  borrowerRating: number | null
  borrowerReviewCount: number
}

export default function UserProfile({
  userName,
  rating,
  totalReviews,
  itemsLent,
  itemsBorrowed,
  joinDate,
  reviews,
  lenderRating,
  lenderReviewCount,
  borrowerRating,
  borrowerReviewCount,
}: UserProfileProps) {
  const formatRatingValue = (value: number | null) => (value !== null ? value.toFixed(2) : "—")
  const formatReviewCount = (count: number) => `${count} review${count === 1 ? "" : "s"}`

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6 border border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">{userName}</h2>
            <p className="text-sm text-muted-foreground">Member since {new Date(joinDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={20} className="fill-accent text-accent" />
              <span className="text-2xl font-bold text-foreground">{formatRatingValue(rating)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{formatReviewCount(totalReviews)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={18} className="text-primary" />
              <span className="text-xl font-semibold text-foreground">{formatRatingValue(lenderRating)}</span>
            </div>
            <p className="text-xs text-muted-foreground">As lender • {formatReviewCount(lenderReviewCount)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={18} className="text-primary" />
              <span className="text-xl font-semibold text-foreground">{formatRatingValue(borrowerRating)}</span>
            </div>
            <p className="text-xs text-muted-foreground">As borrower • {formatReviewCount(borrowerReviewCount)}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{itemsLent}</p>
            <p className="text-xs text-muted-foreground">Items Lent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{itemsBorrowed}</p>
            <p className="text-xs text-muted-foreground">Items Borrowed</p>
          </div>
        </div>
      </Card>

      {/* Reviews Section */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-4">Recent Reviews</h3>
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <Card className="p-6 text-center border border-border">
              <p className="text-muted-foreground">No reviews yet</p>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="p-4 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{review.reviewer}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.date).toLocaleDateString()} • {review.itemTitle}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"}
                      />
                    ))}
                  </div>
                </div>
                {review.review && <p className="text-sm text-foreground">{review.review}</p>}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Trust Indicators */}
      <Card className="p-6 border border-border bg-muted/50">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          Trust Indicators
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-foreground">Email verified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-foreground">
              Active member for {Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalReviews >= 5 ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : (
              <AlertCircle size={16} className="text-yellow-600" />
            )}
            <span className="text-foreground">
              {totalReviews} reviews ({totalReviews >= 5 ? "Verified" : "Building reputation"})
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
