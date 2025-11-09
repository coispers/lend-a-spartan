import UserProfile from "@/components/user-profile"
import type { CurrentUserState, UserReview } from "@/types/interfaces"
import { User } from "lucide-react"

interface RatingSummary {
  average: number | null
  count: number
}

interface ProfileRatingSnapshot {
  asLender: RatingSummary
  asBorrower: RatingSummary
  overallAverage: number | null
  totalCount: number
}

interface ProfileViewProps {
  currentUser: CurrentUserState | null
  ratingStats: ProfileRatingSnapshot
  reviews: UserReview[]
}

export function ProfileView({ currentUser, ratingStats, reviews }: ProfileViewProps) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
          <User size={32} />
          My Profile
        </h2>
      </div>

      {currentUser ? (
        <UserProfile
          userName={currentUser.name}
          rating={ratingStats.overallAverage}
          totalReviews={ratingStats.totalCount}
          itemsLent={currentUser.itemsLent}
          itemsBorrowed={currentUser.itemsBorrowed}
          joinDate={currentUser.joinDate}
          reviews={reviews}
          lenderRating={ratingStats.asLender.average}
          lenderReviewCount={ratingStats.asLender.count}
          borrowerRating={ratingStats.asBorrower.average}
          borrowerReviewCount={ratingStats.asBorrower.count}
        />
      ) : (
        <div className="rounded-md border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Sign in to view your profile details.
        </div>
      )}
    </>
  )
}
