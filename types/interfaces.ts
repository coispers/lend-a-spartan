export interface BorrowRequest {
  id: string
  idSource?: "id" | "uuid" | "request_id" | "generated"
  rawId?: string | number | null
  rawUuid?: string | null
  rawRequestId?: string | number | null
  itemId: string
  itemTitle: string
  itemImage: string | null
  borrowerName: string
  borrowerRating: number
  borrowerId: string
  borrowerEmail: string
  requestDate: Date
  preferredDate: string
  returnDate: string | null
  meetingPlace: string | null
  meetingTime: string | null
  message: string
  status: "pending" | "approved" | "ongoing" | "rejected" | "completed"
  ownerId: string | null
  lenderName: string
  lenderEmail: string | null
  decisionMessage?: string | null
  borrowerFeedbackRating: number | null
  borrowerFeedbackMessage?: string | null
  borrowerFeedbackAt?: Date | null
  lenderFeedbackRating: number | null
  lenderFeedbackMessage?: string | null
  lenderFeedbackAt?: Date | null
}

export interface BorrowSchedule {
  id: string
  requestId?: string | null
  itemId: string
  itemTitle: string
  borrowerName: string
  borrowerId: string | null
  lenderName: string
  lenderId: string | null
  borrowerQRCode: string
  lenderQRCode: string
  startDate: string
  endDate: string
  meetingPlace: string | null
  meetingTime: string | null
  status: "scheduled" | "awaiting_handoff" | "borrowed" | "overdue" | "completed"
  returnReady: boolean
}

export interface MarketplaceItem {
  id: string
  title: string
  category: string
  condition: string
  image?: string | null
  ownerId: string | null
  lender: {
    name: string
    rating: number
    reviews: number
    email?: string | null
  }
  availability: string
  deposit: boolean
  campus: string
  description?: string | null
  createdAt: Date
  quantity: number
}

export interface ListItemFormState {
  title: string
  category: string
  condition: string
  description: string
  campus: string
  quantity: number
  deposit: boolean
  imageFile: File | null
}

export interface UserReview {
  id: string
  rating: number
  review: string
  reviewer: string
  date: Date
  itemTitle: string
}

export type ActivityEntry = {
  id: string
  type: "request" | "approval" | "completion" | "rating"
  title: string
  description: string
  date: Date
  status?: string
}

export type RatingDirection = "borrowerToLender" | "lenderToBorrower"

export type DashboardRole = "combined" | "lender" | "borrower"

export interface DashboardMetricSummary {
  pendingRequests: number
  activeBorrowings: number
  completedTransactions: number
  rating: number | null
  totalReviews: number
}

export interface RatingContextState {
  itemTitle: string
  targetUserName: string
  targetUserId?: string | null
  requestId?: string
  requestIdSource?: BorrowRequest["idSource"]
  originalKeys?: {
    id?: string | number | null
    uuid?: string | null
    request_id?: string | number | null
  }
  direction?: RatingDirection
  existingRating?: number | null
  existingReview?: string | null
}

export interface CurrentUserState {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  fullName: string
  name: string
  email: string
  rating: number
  itemsLent: number
  itemsBorrowed: number
  joinDate: Date
}

export type UserMode = "dashboard" | "browse" | "lend" | "requests" | "schedule" | "profile"
