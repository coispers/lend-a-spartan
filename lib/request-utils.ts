import type { BorrowRequest } from "@/types/interfaces"

export function getBorrowerRequestsForUser(
  borrowRequests: BorrowRequest[],
  currentUserId: string | null | undefined,
  overrides: Map<string, BorrowRequest["status"]>,
): BorrowRequest[] {
  if (!currentUserId) return []
  const id = String(currentUserId)
  return borrowRequests
    .filter((req) => req.borrowerId && String(req.borrowerId) === id)
    .map((req) => {
      const override = overrides.get(req.id)
      return override && override !== req.status ? { ...req, status: override } : req
    })
}

export function getLenderRequestsForUser(
  borrowRequests: BorrowRequest[],
  currentUserId: string | null | undefined,
  overrides: Map<string, BorrowRequest["status"]>,
): BorrowRequest[] {
  if (!currentUserId) return []
  const id = String(currentUserId)
  return borrowRequests
    .filter((req) => req.ownerId && String(req.ownerId) === id)
    .map((req) => {
      const override = overrides.get(req.id)
      return override && override !== req.status ? { ...req, status: override } : req
    })
}

export function buildActiveBorrowRequestsByItem(requests: BorrowRequest[]): Map<string, BorrowRequest> {
  const map = new Map<string, BorrowRequest>()
  requests.forEach((req) => {
    if (req.status === "pending" || req.status === "approved" || req.status === "ongoing") {
      map.set(req.itemId, req)
    }
  })
  return map
}

export function countPendingRequests(requests: BorrowRequest[]): number {
  return requests.filter((req) => req.status === "pending").length
}
