import type { AuthUser } from "@/types/auth"
import type { ActivityEntry, BorrowRequest, DashboardMetricSummary, DashboardRole, UserReview } from "@/types/interfaces"

interface RatingStats {
  asLender: { average: number | null; count: number }
  asBorrower: { average: number | null; count: number }
  overallAverage: number | null
  totalCount: number
}

interface BuildDashboardMetricsArgs {
  borrowRequests: BorrowRequest[]
  borrowerRequests: BorrowRequest[]
  lenderRequests: BorrowRequest[]
  currentUser: AuthUser | null
  ratingStats: RatingStats
}

interface BuildRecentActivityArgs {
  borrowerRequests: BorrowRequest[]
  lenderRequests: BorrowRequest[]
  baseActivity: ActivityEntry[]
}

interface CalculateRecentReviewsArgs {
  borrowRequests: BorrowRequest[]
  currentUserId: string | null | undefined
}

interface CalculateUserItemCountsArgs {
  borrowRequests: BorrowRequest[]
  currentUserId: string | null | undefined
}

export function calculateRatingStats(borrowRequests: BorrowRequest[], currentUserId: string | null | undefined): RatingStats {
  if (!currentUserId) {
    return {
      asLender: { average: null, count: 0 },
      asBorrower: { average: null, count: 0 },
      overallAverage: null,
      totalCount: 0,
    }
  }

  const id = String(currentUserId)

  const average = (values: number[]): number | null =>
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null

  const ratingsAsLender = borrowRequests
    .filter((request) => request.ownerId && String(request.ownerId) === id && request.borrowerFeedbackRating !== null)
    .map((request) => request.borrowerFeedbackRating as number)

  const ratingsAsBorrower = borrowRequests
    .filter((request) => request.borrowerId && String(request.borrowerId) === id && request.lenderFeedbackRating !== null)
    .map((request) => request.lenderFeedbackRating as number)

  const overallPool = [...ratingsAsLender, ...ratingsAsBorrower]

  return {
    asLender: { average: average(ratingsAsLender), count: ratingsAsLender.length },
    asBorrower: { average: average(ratingsAsBorrower), count: ratingsAsBorrower.length },
    overallAverage: average(overallPool),
    totalCount: overallPool.length,
  }
}

export function collectReceivedReviews({ borrowRequests, currentUserId }: CalculateRecentReviewsArgs): UserReview[] {
  if (!currentUserId) return []
  const id = String(currentUserId)
  const reviews: UserReview[] = []

  borrowRequests.forEach((request) => {
    if (request.ownerId && String(request.ownerId) === id && request.borrowerFeedbackRating !== null) {
      reviews.push({
        id: `${request.id}-borrower-feedback`,
        rating: request.borrowerFeedbackRating as number,
        review: request.borrowerFeedbackMessage ?? "",
        reviewer: request.borrowerName,
        date: request.borrowerFeedbackAt ?? request.requestDate,
        itemTitle: request.itemTitle,
      })
    }

    if (request.borrowerId && String(request.borrowerId) === id && request.lenderFeedbackRating !== null) {
      reviews.push({
        id: `${request.id}-lender-feedback`,
        rating: request.lenderFeedbackRating as number,
        review: request.lenderFeedbackMessage ?? "",
        reviewer: request.lenderName,
        date: request.lenderFeedbackAt ?? request.requestDate,
        itemTitle: request.itemTitle,
      })
    }
  })

  reviews.sort((a, b) => b.date.getTime() - a.date.getTime())
  return reviews
}

export function buildDashboardMetrics({
  borrowRequests,
  borrowerRequests,
  lenderRequests,
  currentUser,
  ratingStats,
}: BuildDashboardMetricsArgs): Record<DashboardRole, DashboardMetricSummary> {
  const formatAverage = (average: number | null) => (average === null ? null : Number(average.toFixed(2)))

  const baseMetrics: Record<DashboardRole, DashboardMetricSummary> = {
    combined: {
      pendingRequests: 0,
      activeBorrowings: 0,
      completedTransactions: 0,
      rating: formatAverage(ratingStats.overallAverage),
      totalReviews: ratingStats.totalCount,
    },
    lender: {
      pendingRequests: 0,
      activeBorrowings: 0,
      completedTransactions: 0,
      rating: formatAverage(ratingStats.asLender.average),
      totalReviews: ratingStats.asLender.count,
    },
    borrower: {
      pendingRequests: 0,
      activeBorrowings: 0,
      completedTransactions: 0,
      rating: formatAverage(ratingStats.asBorrower.average),
      totalReviews: ratingStats.asBorrower.count,
    },
  }

  if (!currentUser) {
    return baseMetrics
  }

  const normalize = (value?: string | null) => (value ? value.trim().toLowerCase() : "")

  const nameTokens = new Set<string>()
  const addName = (value?: string | null) => {
    const normalized = normalize(value)
    if (normalized) {
      nameTokens.add(normalized)
    }
  }

  addName((currentUser as any).name)
  addName((currentUser as any).fullName)
  addName(
    (currentUser as any).firstName && (currentUser as any).lastName
      ? `${(currentUser as any).firstName} ${(currentUser as any).lastName}`
      : null,
  )

  const currentUserId = currentUser.id ? String(currentUser.id) : null
  const matchesUser = (candidateId?: string | null, candidateName?: string | null) => {
    if (currentUserId && candidateId && String(candidateId) === currentUserId) {
      return true
    }
    const normalized = normalize(candidateName)
    return normalized ? nameTokens.has(normalized) : false
  }

  const borrowerPending = countPending(borrowerRequests)
  const lenderPending = countPending(lenderRequests)

  baseMetrics.borrower.pendingRequests = borrowerPending
  baseMetrics.lender.pendingRequests = lenderPending
  baseMetrics.combined.pendingRequests = borrowerPending + lenderPending

  let borrowerActive = 0
  let lenderActive = 0
  let borrowerCompleted = 0
  let lenderCompleted = 0

  borrowRequests.forEach((request) => {
    const isBorrower = matchesUser(request.borrowerId, request.borrowerName)
    const isLender = matchesUser(request.ownerId, request.lenderName)
    if (!isBorrower && !isLender) return

    if (request.status === "approved") {
      if (isBorrower) borrowerActive += 1
      if (isLender) lenderActive += 1
    }

    if (request.status === "completed") {
      if (isBorrower) borrowerCompleted += 1
      if (isLender) lenderCompleted += 1
    }
  })

  baseMetrics.borrower.activeBorrowings = borrowerActive
  baseMetrics.lender.activeBorrowings = lenderActive
  baseMetrics.combined.activeBorrowings = borrowerActive + lenderActive

  baseMetrics.borrower.completedTransactions = borrowerCompleted
  baseMetrics.lender.completedTransactions = lenderCompleted
  baseMetrics.combined.completedTransactions = borrowerCompleted + lenderCompleted

  return baseMetrics
}

export function buildRecentActivity({
  borrowerRequests,
  lenderRequests,
  baseActivity,
}: BuildRecentActivityArgs): ActivityEntry[] {
  const activity: ActivityEntry[] = lenderRequests.map((req) => ({
    id: `lender-${req.id}`,
    type: "request",
    title: `Request for ${req.itemTitle}`,
    description: `${req.borrowerName} would like to borrow on ${req.preferredDate}`,
    date: req.requestDate,
    status: capitalizeStatus(req.status),
  }))

  borrowerRequests.forEach((req) => {
    const statusLabel = capitalizeStatus(req.status)
    const type: ActivityEntry["type"] =
      req.status === "completed" ? "completion" : req.status === "approved" ? "approval" : "request"
    activity.push({
      id: `borrower-${req.id}`,
      type,
      title: `${statusLabel} · ${req.itemTitle}`,
      description:
        type === "request"
          ? `Waiting for ${req.lenderName} to respond`
          : type === "approval"
            ? `${req.lenderName} approved your request`
            : `${req.lenderName} marked the borrowing complete`,
      date: req.requestDate,
      status: statusLabel,
    })
  })

  activity.sort((a, b) => b.date.getTime() - a.date.getTime())

  if (activity.length === 0) {
    return baseActivity
  }

  return [...activity, ...baseActivity].slice(0, 6)
}

export function calculateUserItemCounts({
  borrowRequests,
  currentUserId,
}: CalculateUserItemCountsArgs): { lent: number; borrowed: number } {
  if (!currentUserId) {
    return { lent: 0, borrowed: 0 }
  }

  const id = String(currentUserId)
  const isCountableStatus = (status: BorrowRequest["status"]) =>
    status === "approved" || status === "ongoing" || status === "completed"

  const lent = borrowRequests.filter(
    (request) => request.ownerId && String(request.ownerId) === id && isCountableStatus(request.status),
  ).length

  const borrowed = borrowRequests.filter(
    (request) => request.borrowerId && String(request.borrowerId) === id && isCountableStatus(request.status),
  ).length

  return { lent, borrowed }
}

function countPending(requests: BorrowRequest[]): number {
  return requests.filter((req) => req.status === "pending").length
}

function capitalizeStatus(status: BorrowRequest["status"]): string {
  if (!status) return ""
  return status.charAt(0).toUpperCase() + status.slice(1)
}
