import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabaseclient"
import { mapBorrowRequestRecord } from "@/lib/mappers"
import type { BorrowRequest, RatingContextState } from "@/types/interfaces"

interface SubmitRatingPayload {
  rating: number
  review: string
}

interface UseRatingsFeatureOptions {
  setBorrowRequests: React.Dispatch<React.SetStateAction<BorrowRequest[]>>
  showBanner: (message: string, type?: "success" | "error" | "info") => void
}

export const useRatingsFeature = ({
  setBorrowRequests,
  showBanner,
}: UseRatingsFeatureOptions) => {
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingContext, setRatingContext] = useState<RatingContextState | null>(null)

  const openRatingModal = useCallback((context: RatingContextState) => {
    setRatingContext(context)
    setShowRatingModal(true)
  }, [])

  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false)
    setRatingContext(null)
  }, [])

  const handleSubmitRating = useCallback(
    async (data: SubmitRatingPayload) => {
      if (!ratingContext) {
        return
      }

      const trimmedReview = data.review.trim()

      if (ratingContext.requestId && ratingContext.direction) {
        try {
          const nowIso = new Date().toISOString()
          const payload =
            ratingContext.direction === "borrowerToLender"
              ? {
                  borrower_feedback_rating: data.rating,
                  borrower_feedback_message: trimmedReview || null,
                  borrower_feedback_at: nowIso,
                }
              : {
                  lender_feedback_rating: data.rating,
                  lender_feedback_message: trimmedReview || null,
                  lender_feedback_at: nowIso,
                }

          const requestIdValue = Number.isFinite(Number(ratingContext.requestId))
            ? Number(ratingContext.requestId)
            : ratingContext.requestId

          const { data: updatedRows, error } = await supabase
            .from("borrow_requests")
            .update(payload)
            .eq("id", requestIdValue)
            .select()
            .limit(1)

          if (error) {
            console.error("Failed to submit rating", error)
            showBanner("Failed to submit rating. Please try again.", "error")
            return
          }

          const updated = updatedRows?.[0]

          let effectiveRecord = updated

          if (!effectiveRecord) {
            const { data: fetchedRows, error: fetchError } = await supabase
              .from("borrow_requests")
              .select()
              .eq("id", requestIdValue)
              .limit(1)

            if (fetchError) {
              console.error("Failed to confirm rating update", fetchError)
              showBanner("We couldn't update that request. Please refresh and try again.", "error")
              return
            }

            effectiveRecord = fetchedRows?.[0]

            if (!effectiveRecord) {
              showBanner("We couldn't update that request. Please refresh and try again.", "error")
              return
            }
          }

          const mapped = mapBorrowRequestRecord(effectiveRecord)
          setBorrowRequests((prev) => prev.map((req) => (req.id === mapped.id ? mapped : req)))

          closeRatingModal()
          showBanner("Rating submitted successfully!", "success")
          return
        } catch (err) {
          console.error("Unexpected error while submitting rating", err)
          showBanner("An unexpected error occurred while submitting the rating.", "error")
          return
        }
      }

      closeRatingModal()
      showBanner("Rating submitted successfully!", "success")
    },
    [closeRatingModal, ratingContext, setBorrowRequests, showBanner],
  )

  return {
    showRatingModal,
    ratingContext,
    openRatingModal,
    closeRatingModal,
    handleSubmitRating,
  }
}
