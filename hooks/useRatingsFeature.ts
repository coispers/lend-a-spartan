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

          const rawRequestId = ratingContext.requestId ?? null
          const numericRequestId = rawRequestId !== null ? Number(rawRequestId) : null
          const hasNumericId = Number.isFinite(numericRequestId)

          type ColumnName = "id" | "uuid" | "request_id"
          const isMissingColumnError = (error: { code?: string | null; message?: string | null } | null | undefined) => {
            if (!error) return false
            const code = error.code ?? ""
            if (code === "42703" || code === "PGRST103") {
              return true
            }
            const message = (error.message ?? "").toLowerCase()
            return message.includes("does not exist") && message.includes("column")
          }

          const attempts: Array<{ column: ColumnName; value: string | number }> = []
          const addAttempt = (column: ColumnName, value: string | number | null | undefined) => {
            if (value === null || value === undefined) return
            let normalized: string | number = value
            if (typeof normalized === "string") {
              const trimmed = normalized.trim()
              if (!trimmed) return
              normalized = trimmed
            }
            const key = `${column}:${String(normalized)}`
            if (!attempts.some((existing) => `${existing.column}:${String(existing.value)}` === key)) {
              attempts.push({ column, value: normalized })
            }
          }

          const addNumericVariant = (column: ColumnName, value: string | number | null | undefined) => {
            if (value === null || value === undefined) return
            if (typeof value === "number") {
              addAttempt(column, value)
              return
            }
            const trimmed = value.trim()
            if (!trimmed) return
            const numeric = Number(trimmed)
            if (Number.isFinite(numeric)) {
              addAttempt(column, numeric)
            }
          }

          const addUuidAttempt = (value: string | number | null | undefined) => {
            if (typeof value !== "string") return
            const trimmed = value.trim()
            if (!trimmed) return
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (uuidPattern.test(trimmed)) {
              addAttempt("uuid", trimmed)
            }
          }

          const originalKeys = ratingContext.originalKeys ?? {}
          addAttempt("id", originalKeys.id ?? null)
          addNumericVariant("id", originalKeys.id ?? null)
          addUuidAttempt(originalKeys.uuid ?? null)
          addAttempt("request_id", originalKeys.request_id ?? null)
          addNumericVariant("request_id", originalKeys.request_id ?? null)

          if (rawRequestId !== null) {
            const sourceColumn: ColumnName =
              ratingContext.requestIdSource === "uuid"
                ? "uuid"
                : ratingContext.requestIdSource === "request_id"
                  ? "request_id"
                  : "id"
            const numericFromRaw =
              typeof rawRequestId === "number"
                ? rawRequestId
                : typeof rawRequestId === "string" && rawRequestId.trim() !== ""
                  ? Number(rawRequestId.trim())
                  : null
            addAttempt(sourceColumn, rawRequestId)
            if (sourceColumn === "request_id") {
              addNumericVariant("request_id", rawRequestId)
            } else if (Number.isFinite(numericFromRaw)) {
              addAttempt("request_id", numericFromRaw as number)
            }
            addAttempt("id", rawRequestId)
            addUuidAttempt(rawRequestId)
            addNumericVariant("id", rawRequestId)
          }

          if (hasNumericId) {
            addAttempt("id", numericRequestId as number)
            addAttempt("request_id", numericRequestId as number)
          }

          if (attempts.length === 0 && ratingContext.requestId) {
            addAttempt("id", ratingContext.requestId)
            addNumericVariant("id", ratingContext.requestId)
            addUuidAttempt(ratingContext.requestId)
            addAttempt("request_id", ratingContext.requestId)
            addNumericVariant("request_id", ratingContext.requestId)
          }

          const resolveNumericValue = (value: string | number | null | undefined) => {
            if (value === null || value === undefined) return null
            if (typeof value === "number") return value
            const trimmed = value.trim()
            if (!trimmed) return null
            const numeric = Number(trimmed)
            return Number.isFinite(numeric) ? numeric : null
          }

          let updateIdentifier: string | number | null = originalKeys.id ?? null
          if (updateIdentifier === null && ratingContext.requestIdSource === "id" && ratingContext.requestId) {
            updateIdentifier = hasNumericId ? (numericRequestId as number) : ratingContext.requestId
          }

          let fetchError: any = null

          if (updateIdentifier === null) {
            const executeFetch = async (column: ColumnName, identifier: string | number) =>
              supabase.from("borrow_requests").select("id").eq(column, identifier).limit(1)

            for (const attempt of attempts) {
              const result = await executeFetch(attempt.column, attempt.value)
              if (result.error) {
                if (isMissingColumnError(result.error)) {
                  continue
                }
                fetchError = result.error
                continue
              }
              const fetchedId = result.data?.[0]?.id
              if (fetchedId !== null && fetchedId !== undefined) {
                updateIdentifier = fetchedId
                break
              }
            }
          }

          if (updateIdentifier === null && fetchError) {
            console.error("Failed to locate borrow request", fetchError)
            showBanner("Failed to submit rating. Please try again.", "error")
            return
          }

          if (updateIdentifier === null) {
            showBanner("We couldn't update that request. Please refresh and try again.", "error")
            return
          }

          const updateIdNumeric = resolveNumericValue(updateIdentifier)
          const updateCandidates: Array<string | number> = []
          const pushUpdateCandidate = (value: string | number | null) => {
            if (value === null || value === undefined) return
            const key = `${typeof value}:${String(value)}`
            if (!updateCandidates.some((existing) => `${typeof existing}:${String(existing)}` === key)) {
              updateCandidates.push(value)
            }
          }

          if (typeof updateIdentifier === "number" || typeof updateIdentifier === "string") {
            pushUpdateCandidate(updateIdentifier)
          }
          if (updateIdNumeric !== null) {
            pushUpdateCandidate(updateIdNumeric)
          }

          if (updateCandidates.length === 0) {
            showBanner("We couldn't update that request. Please refresh and try again.", "error")
            return
          }

          let updatedRows: any[] | null = null
          let updateError: any = null

          for (const candidate of updateCandidates) {
            const result = await supabase
              .from("borrow_requests")
              .update(payload)
              .eq("id", candidate)
              .select()
              .limit(1)

            if (result.error) {
              updateError = result.error
              if (isMissingColumnError(result.error)) {
                continue
              }
              continue
            }

            if ((result.data?.length ?? 0) > 0) {
              updatedRows = result.data
              break
            }
          }

          if (!updatedRows && updateError) {
            console.error("Failed to submit rating", updateError)
            showBanner("Failed to submit rating. Please try again.", "error")
            return
          }

          const updated = updatedRows?.[0]

          let effectiveRecord = updated

          if (!effectiveRecord) {
            const executeFetch = async (identifier: string | number) =>
              supabase.from("borrow_requests").select().eq("id", identifier).limit(1)

            for (const candidate of updateCandidates) {
              const result = await executeFetch(candidate)
              if (result.error) {
                fetchError = result.error
                continue
              }
              if ((result.data?.length ?? 0) > 0) {
                effectiveRecord = result.data?.[0]
                break
              }
            }

            if (!effectiveRecord) {
              if (fetchError) {
                console.error("Failed to confirm rating update", fetchError)
              }
              showBanner("We couldn't update that request. Please refresh and try again.", "error")
              return
            }
          }

          let mapped = mapBorrowRequestRecord(effectiveRecord)

          const hasFeedbackApplied =
            ratingContext.direction === "borrowerToLender"
              ? mapped.borrowerFeedbackRating !== null
              : mapped.lenderFeedbackRating !== null

          if (!hasFeedbackApplied && ratingContext.requestId) {
            const submittedAt = new Date(nowIso)
            const reviewMessage = trimmedReview ? trimmedReview : null
            if (ratingContext.direction === "borrowerToLender") {
              mapped = {
                ...mapped,
                borrowerFeedbackRating: data.rating,
                borrowerFeedbackMessage: reviewMessage,
                borrowerFeedbackAt: submittedAt,
              }
            } else {
              mapped = {
                ...mapped,
                lenderFeedbackRating: data.rating,
                lenderFeedbackMessage: reviewMessage,
                lenderFeedbackAt: submittedAt,
              }
            }
          }

          const knownIds = new Set<string>([
            String(mapped.id),
            ratingContext.requestId ? String(ratingContext.requestId) : String(mapped.id),
          ])

          setBorrowRequests((prev) =>
            prev.map((req) => (knownIds.has(String(req.id)) ? { ...mapped, id: String(mapped.id) } : req)),
          )

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
