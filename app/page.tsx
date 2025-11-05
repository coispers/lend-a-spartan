"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Inbox, Calendar, User, Save, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import Navigation from "@/components/navigation"
import ItemDetailModal from "@/components/item-detail-modal"
import RequestModal from "@/components/request-modal"
import SearchFilters from "@/components/search-filters"
import ItemsGrid from "@/components/items-grid"
import RequestsDashboard from "@/components/requests-dashboard"
import BorrowScheduleComponent from "@/components/borrow-schedule"
import ScheduleModal from "@/components/schedule-modal"
import QRCodeGenerator from "@/components/qr-code-generator"
import QRScanner from "@/components/qr-scanner"
import RatingModal from "@/components/rating-modal"
import UserProfile from "@/components/user-profile"
import Dashboard from "@/components/dashboard"
import SignInModal from "@/components/signin-modal"
import RegisterModal from "@/components/register-modal"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { supabase } from "@/lib/supabaseclient"
import type { AuthUser } from "@/types/auth"

interface BorrowRequest {
  id: string
  itemId: string
  itemTitle: string
  itemImage: string | null
  borrowerName: string
  borrowerRating: number
  borrowerId: string
  borrowerEmail: string
  requestDate: Date
  preferredDate: string
  message: string
  status: "pending" | "approved" | "rejected" | "completed"
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

interface BorrowSchedule {
  id: string
  itemId: string
  itemTitle: string
  borrowerName: string
  lenderName: string
  borrowerQRCode: string
  lenderQRCode: string
  startDate: string
  endDate: string
  status: "scheduled" | "awaiting_handoff" | "borrowed" | "overdue" | "completed"
  returnReady: boolean
}

interface MarketplaceItem {
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

interface ListItemFormState {
  title: string
  category: string
  condition: string
  description: string
  campus: string
  quantity: number
  deposit: boolean
  imageFile: File | null
}

interface UserReview {
  id: string
  rating: number
  review: string
  reviewer: string
  date: Date
  itemTitle: string
}

type ActivityEntry = {
  id: string
  type: "request" | "approval" | "completion" | "rating"
  title: string
  description: string
  date: Date
  status?: string
}

type RatingDirection = "borrowerToLender" | "lenderToBorrower"

interface RatingContextState {
  itemTitle: string
  targetUserName: string
  targetUserId?: string | null
  requestId?: string
  direction?: RatingDirection
  existingRating?: number | null
  existingReview?: string | null
}
//set to true to enable email notifications. 
const ENABLE_EMAIL_NOTIFICATIONS = false

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showItemDetail, setShowItemDetail] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [userMode, setUserMode] = useState<"dashboard" | "browse" | "lend" | "requests" | "schedule" | "profile">(
    "dashboard",
  )
  const [sortBy, setSortBy] = useState("newest")
  const [filterCondition, setFilterCondition] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<BorrowSchedule | null>(null)
  const [selectedQRCode, setSelectedQRCode] = useState<{ schedule: BorrowSchedule; type: "borrower" | "lender" } | null>(
    null,
  )
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanType, setScanType] = useState<"handoff" | "return" | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingContext, setRatingContext] = useState<RatingContextState | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [requestsView, setRequestsView] = useState<"borrower" | "lender">("borrower")
  const [requestError, setRequestError] = useState<string | null>(null)
  const [lenderNotification, setLenderNotification] = useState<string | null>(null)
  const previousRequestIdsRef = useRef<Set<string>>(new Set())
  const profileRatingSyncRef = useRef<number | null | undefined>(undefined)

  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([])

  const receivedReviews = useMemo<UserReview[]>(() => {
    if (!currentUser?.id) return []
    const userId = currentUser.id

    const reviews: UserReview[] = []

    borrowRequests.forEach((request) => {
      if (request.ownerId === userId && request.borrowerFeedbackRating !== null) {
        reviews.push({
          id: `${request.id}-borrower-feedback`,
          rating: request.borrowerFeedbackRating,
          review: request.borrowerFeedbackMessage ?? "",
          reviewer: request.borrowerName,
          date: request.borrowerFeedbackAt ?? request.requestDate,
          itemTitle: request.itemTitle,
        })
      }

      if (request.borrowerId === userId && request.lenderFeedbackRating !== null) {
        reviews.push({
          id: `${request.id}-lender-feedback`,
          rating: request.lenderFeedbackRating,
          review: request.lenderFeedbackMessage ?? "",
          reviewer: request.lenderName,
          date: request.lenderFeedbackAt ?? request.requestDate,
          itemTitle: request.itemTitle,
        })
      }
    })

    reviews.sort((a, b) => b.date.getTime() - a.date.getTime())
    return reviews
  }, [borrowRequests, currentUser?.id])

  const ratingStats = useMemo(() => {
    if (!currentUser?.id) {
      return {
        asLender: { average: null as number | null, count: 0 },
        asBorrower: { average: null as number | null, count: 0 },
        overallAverage: null as number | null,
        totalCount: 0,
      }
    }

    const userId = currentUser.id

    const average = (values: number[]): number | null =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null

    const ratingsAsLender = borrowRequests
      .filter((request) => request.ownerId === userId && request.borrowerFeedbackRating !== null)
      .map((request) => request.borrowerFeedbackRating as number)

    const ratingsAsBorrower = borrowRequests
      .filter((request) => request.borrowerId === userId && request.lenderFeedbackRating !== null)
      .map((request) => request.lenderFeedbackRating as number)

    const overallPool = [...ratingsAsLender, ...ratingsAsBorrower]

    return {
      asLender: { average: average(ratingsAsLender), count: ratingsAsLender.length },
      asBorrower: { average: average(ratingsAsBorrower), count: ratingsAsBorrower.length },
      overallAverage: average(overallPool),
      totalCount: overallPool.length,
    }
  }, [borrowRequests, currentUser?.id])

  useEffect(() => {
    setCurrentUser((prev: any) => {
      if (!prev) return prev
      const nextRating = ratingStats.totalCount > 0 && ratingStats.overallAverage !== null
        ? Number(ratingStats.overallAverage.toFixed(2))
        : 0
      if (prev.rating === nextRating) return prev
      return { ...prev, rating: nextRating }
    })
  }, [ratingStats])

  useEffect(() => {
    if (!currentUser?.id) return
    const nextRating = ratingStats.totalCount > 0 && ratingStats.overallAverage !== null
      ? Number(ratingStats.overallAverage.toFixed(2))
      : null
    if (profileRatingSyncRef.current === nextRating) return
    profileRatingSyncRef.current = nextRating

    void supabase
      .from("profiles")
      .update({ rating: nextRating })
      .eq("id", currentUser.id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to sync profile rating", error)
        }
      })
  }, [currentUser?.id, ratingStats.overallAverage, ratingStats.totalCount])

  const [borrowSchedules, setBorrowSchedules] = useState<BorrowSchedule[]>(() => {
    const base = Date.now()
    const slugify = (value: string) => value.replace(/\s+/g, "-").toLowerCase()
    const makeCode = (prefix: "borrower" | "lender", name: string, offset: number) =>
      `${prefix}-${slugify(name)}-${base + offset}`

    return [
      {
        id: "sched-1",
        itemId: "1",
        itemTitle: "Laptop Stand",
        borrowerName: "Alex Johnson",
        lenderName: "Juan Dela Cruz",
        borrowerQRCode: makeCode("borrower", "Alex Johnson", 0),
        lenderQRCode: makeCode("lender", "Juan Dela Cruz", 0),
        startDate: "2025-10-20",
        endDate: "2025-10-27",
        status: "awaiting_handoff",
        returnReady: false,
      },
      {
        id: "sched-2",
        itemId: "2",
        itemTitle: "Calculus Textbook",
        borrowerName: "Sarah Lee",
        lenderName: "Maria Santos",
        borrowerQRCode: makeCode("borrower", "Sarah Lee", 1),
        lenderQRCode: makeCode("lender", "Maria Santos", 1),
        startDate: "2025-11-10",
        endDate: "2025-11-17",
        status: "scheduled",
        returnReady: false,
      },
      {
        id: "sched-3",
        itemId: "3",
        itemTitle: "DSLR Camera",
        borrowerName: "Miguel Rivera",
        lenderName: "Carla Gomez",
        borrowerQRCode: makeCode("borrower", "Miguel Rivera", 2),
        lenderQRCode: makeCode("lender", "Carla Gomez", 2),
        startDate: "2025-10-25",
        endDate: "2025-11-05",
        status: "borrowed",
        returnReady: true,
      },
      {
        id: "sched-4",
        itemId: "4",
        itemTitle: "Wireless Microphone",
        borrowerName: "Jenna Brooks",
        lenderName: "Noel Tan",
        borrowerQRCode: makeCode("borrower", "Jenna Brooks", 3),
        lenderQRCode: makeCode("lender", "Noel Tan", 3),
        startDate: "2025-09-15",
        endDate: "2025-09-22",
        status: "overdue",
        returnReady: true,
      },
      {
        id: "sched-5",
        itemId: "5",
        itemTitle: "Graphic Tablet",
        borrowerName: "Harper Kim",
        lenderName: "Luis Fernandez",
        borrowerQRCode: makeCode("borrower", "Harper Kim", 4),
        lenderQRCode: makeCode("lender", "Luis Fernandez", 4),
        startDate: "2025-08-28",
        endDate: "2025-09-04",
        status: "completed",
        returnReady: false,
      },
    ]
  })

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [deleteItemError, setDeleteItemError] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [uiBanner, setUiBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MarketplaceItem | null>(null)
  const [isProcessingDelete, setIsProcessingDelete] = useState(false)
  const [removingItemIds, setRemovingItemIds] = useState<Set<string>>(() => new Set<string>())
  const removalAnimationMs = 320

  const showBanner = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setUiBanner({ message, type })
  }, [])

  const openRatingModal = (context: RatingContextState) => {
    setRatingContext(context)
    setShowRatingModal(true)
  }

  const closeRatingModal = () => {
    setShowRatingModal(false)
    setRatingContext(null)
  }

  useEffect(() => {
    if (!uiBanner) return
    const timeout = window.setTimeout(() => {
      setUiBanner(null)
    }, 5000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [uiBanner])

  const [listItemForm, setListItemForm] = useState<ListItemFormState>({
    title: "",
    category: "Electronics",
    condition: "Like New",
    description: "",
    campus: "Main Campus",
    quantity: 1,
    deposit: false,
    imageFile: null,
  })
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const [listItemError, setListItemError] = useState<string | null>(null)
  const [listItemSuccess, setListItemSuccess] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [listItemExistingImage, setListItemExistingImage] = useState<string | null>(null)

  const resetListItemState = () => {
    setListItemForm({
      title: "",
      category: "Electronics",
      condition: "Like New",
      description: "",
      campus: "Main Campus",
      quantity: 1,
      deposit: false,
      imageFile: null,
    })
    setImagePreviewUrl(null)
    setEditingItemId(null)
    setListItemExistingImage(null)
  }

  useEffect(() => {
    if (!imagePreviewUrl || !imagePreviewUrl.startsWith("blob:")) return
    return () => {
      URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const mapItemRecord = useCallback((record: any): MarketplaceItem => {
    const safeNumber = (value: any, fallback: number) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    const quantity = safeNumber(record?.quantity, 1)

    return {
      id: String(record?.id ?? record?.uuid ?? `item-${Date.now()}`),
      title: record?.title ?? "Untitled Item",
      category: record?.category ?? "Other",
      condition: record?.condition ?? "Good",
      image: record?.image_url ?? record?.image ?? null,
      ownerId: record?.owner_id ? String(record.owner_id) : null,
      lender: {
        name: record?.lender_name ?? record?.owner_name ?? "Community Lender",
        rating: safeNumber(record?.lender_rating, 5),
        reviews: safeNumber(record?.lender_reviews, 0),
        email: record?.lender_email ?? record?.owner_email ?? record?.email ?? null,
      },
      availability: record?.availability ?? (quantity > 0 ? "Available" : "Unavailable"),
      deposit: Boolean(record?.deposit ?? record?.deposit_required ?? false),
      campus: record?.campus ?? "Main Campus",
      description: record?.description ?? "",
      createdAt: record?.created_at ? new Date(record.created_at) : new Date(),
      quantity,
    }
  }, [])

  const mapBorrowRequestRecord = useCallback((record: any): BorrowRequest => {
    const safeString = (value: any) => {
      if (value === null || value === undefined) return ""
      return String(value)
    }

    const safeNumber = (value: any) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    const safeOptionalNumber = (value: any) => {
      if (value === null || value === undefined) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    const safeDate = (value: any) => {
      if (!value) return null
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }

    return {
      id: safeString(record?.id ?? record?.uuid ?? `req-${Date.now()}`),
      itemId: safeString(record?.item_id ?? record?.itemId ?? ""),
      itemTitle: record?.item_title ?? record?.itemTitle ?? "Borrowed Item",
      itemImage: record?.item_image ?? record?.itemImage ?? null,
      borrowerName: record?.borrower_name ?? record?.borrowerName ?? "Borrower",
      borrowerRating: safeNumber(record?.borrower_rating ?? record?.borrowerRating ?? 0),
      borrowerId: safeString(record?.borrower_id ?? record?.borrowerId ?? ""),
      borrowerEmail: record?.borrower_email ?? record?.borrowerEmail ?? "",
      requestDate:
        record?.created_at
          ? new Date(record.created_at)
          : record?.request_date
            ? new Date(record.request_date)
            : new Date(),
      preferredDate: record?.preferred_date ?? record?.preferredDate ?? "",
      message: record?.message ?? record?.borrower_message ?? "",
      status: (record?.status ?? "pending") as BorrowRequest["status"],
      ownerId: record?.owner_id
        ? safeString(record.owner_id)
        : record?.lender_id
          ? safeString(record.lender_id)
          : null,
      lenderName: record?.lender_name ?? record?.lenderName ?? "Lender",
      lenderEmail: record?.lender_email ?? record?.lenderEmail ?? null,
      decisionMessage: record?.decision_message ?? record?.decisionMessage ?? record?.response_message ?? null,
      borrowerFeedbackRating: safeOptionalNumber(
        record?.borrower_feedback_rating ?? record?.borrowerFeedbackRating ?? null,
      ),
      borrowerFeedbackMessage:
        record?.borrower_feedback_message ?? record?.borrowerFeedbackMessage ?? record?.borrower_review ?? null,
      borrowerFeedbackAt: safeDate(record?.borrower_feedback_at ?? record?.borrowerFeedbackAt ?? null),
      lenderFeedbackRating: safeOptionalNumber(record?.lender_feedback_rating ?? record?.lenderFeedbackRating ?? null),
      lenderFeedbackMessage:
        record?.lender_feedback_message ?? record?.lenderFeedbackMessage ?? record?.lender_review ?? null,
      lenderFeedbackAt: safeDate(record?.lender_feedback_at ?? record?.lenderFeedbackAt ?? null),
    }
  }, [])

  const fetchBorrowRequests = useCallback(
    async (userId: string) => {
      if (!userId) {
        setBorrowRequests([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("borrow_requests")
          .select("*")
          .or(`borrower_id.eq.${userId},owner_id.eq.${userId}`)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Failed to load borrow requests", error)
          setBorrowRequests([])
          return
        }

  const mapped = (data ?? []).map(mapBorrowRequestRecord)
  mapped.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
        setBorrowRequests(mapped)
      } catch (err) {
        console.error("Unexpected error while loading borrow requests", err)
        setBorrowRequests([])
      }
    },
    [mapBorrowRequestRecord],
  )

  const sendLenderEmailNotification = useCallback(
    async (payload: {
      email: string
      itemTitle: string
      borrowerName: string
      preferredDate: string
      message: string
    }) => {
      if (!ENABLE_EMAIL_NOTIFICATIONS) {
        return
      }
      try {
        const { error } = await supabase.functions.invoke("send-lender-notification", {
          body: payload,
        })
        if (error) {
          throw error
        }
      } catch (error) {
        console.error("Failed to send lender email notification", error)
      }
    },
    [],
  )

  const sendBorrowerEmailNotification = useCallback(
    async (payload: {
      email: string
      itemTitle: string
      borrowerName: string
      lenderName: string
      preferredDate: string
      decisionMessage?: string | null
      notificationType: "approval" | "rejection"
    }) => {
      if (!ENABLE_EMAIL_NOTIFICATIONS) {
        return
      }
      try {
        const { error } = await supabase.functions.invoke("send-lender-notification", {
          body: {
            email: payload.email,
            itemTitle: payload.itemTitle,
            borrowerName: payload.borrowerName,
            lenderName: payload.lenderName,
            preferredDate: payload.preferredDate,
            decisionMessage: payload.decisionMessage ?? "",
            notificationType: payload.notificationType,
          },
        })
        if (error) {
          throw error
        }
      } catch (error) {
        console.error("Failed to send borrower email notification", error)
      }
    },
    [],
  )

  const updateItemQuantity = useCallback(async (itemId: string, adjustment: number) => {
    let nextQuantity: number | null = null
    let nextAvailability: string | null = null

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const quantity = Math.max(0, (item.quantity ?? 0) + adjustment)
        nextQuantity = quantity
        const availability = quantity > 0 ? "Available" : "Unavailable"
        nextAvailability = availability
        return { ...item, quantity, availability }
      }),
    )

    setSelectedItem((prev) => {
      if (!prev || prev.id !== itemId || nextQuantity === null || nextAvailability === null) return prev
      return { ...prev, quantity: nextQuantity, availability: nextAvailability }
    })

    if (nextQuantity === null || nextAvailability === null) {
      return
    }

    try {
      const numericId = Number(itemId)
      const query = supabase
        .from("items")
        .update({
          quantity: nextQuantity,
          availability: nextAvailability,
        })

      const { data, error } = Number.isFinite(numericId)
        ? await query.eq("id", numericId).select("id, quantity").maybeSingle()
        : await query.eq("id", itemId).select("id, quantity").maybeSingle()

      if (error) {
        console.error("Failed to update item quantity", error)
      } else if (!data) {
        console.warn("Item quantity update did not match any row", { itemId, nextQuantity })
      }
    } catch (err) {
      console.error("Unexpected error while updating item quantity", err)
    }
  }, [])

  const fetchItems = useCallback(async () => {
    setItemsLoading(true)
    setItemsError(null)

    try {
      const { data, error } = await supabase.from("items").select("*")

      if (error) {
        console.error("Failed to load marketplace items", error)
        setItems([])
        setItemsError(error.message)
        return
      }

      const mapped = (data ?? []).map(mapItemRecord)
      mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setItems(mapped)
    } catch (err) {
      console.error("Unexpected error while loading marketplace items", err)
      setItems([])
      setItemsError(err instanceof Error ? err.message : "Unexpected error loading items")
    } finally {
      setItemsLoading(false)
    }
  }, [mapItemRecord])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    const userId = currentUser?.id
    if (!userId) {
      setBorrowRequests([])
      return
    }
    void fetchBorrowRequests(userId)
  }, [currentUser?.id, fetchBorrowRequests])

  useEffect(() => {
    const userId = currentUser?.id
    if (!userId) {
      return
    }

    const handleChange = (payload: any) => {
      const eventType = payload?.eventType
      if (eventType === "DELETE") {
        const removedId = payload?.old?.id ?? payload?.old?.uuid
        if (!removedId) return
        setBorrowRequests((prev) => prev.filter((req) => req.id !== String(removedId)))
        return
      }

      const record = payload?.new
      if (!record) return
      const mapped = mapBorrowRequestRecord(record)
      setBorrowRequests((prev) => {
        const existingIndex = prev.findIndex((req) => req.id === mapped.id)
        if (existingIndex >= 0) {
          const next = [...prev]
          next[existingIndex] = mapped
          next.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
          return next
        }
        const next = [mapped, ...prev]
        next.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
        return next
      })
    }

    const channel = supabase
      .channel(`borrow-requests-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_requests", filter: `owner_id=eq.${userId}` },
        handleChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_requests", filter: `borrower_id=eq.${userId}` },
        handleChange,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUser?.id, mapBorrowRequestRecord])

  useEffect(() => {
    previousRequestIdsRef.current = new Set()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      setLenderNotification(null)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      previousRequestIdsRef.current = new Set()
      return
    }
    const ownedRequests = borrowRequests.filter((req) => req.ownerId === currentUser.id)
    const prevIds = previousRequestIdsRef.current
    if (prevIds.size === 0) {
      previousRequestIdsRef.current = new Set(borrowRequests.map((req) => req.id))
      return
    }
    const newPending = ownedRequests.filter((req) => req.status === "pending" && !prevIds.has(req.id))
    if (newPending.length > 0) {
      const latest = newPending[0]
      setLenderNotification(`New borrow request for ${latest.itemTitle} from ${latest.borrowerName}.`)
    }
    previousRequestIdsRef.current = new Set(borrowRequests.map((req) => req.id))
  }, [borrowRequests, currentUser])

  useEffect(() => {
    if (!showRequestModal) {
      setRequestError(null)
    }
  }, [showRequestModal])

  const filteredAndSortedItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    const filtered = items.filter((item) => {
      const isOwnerViewing = currentUser && item.ownerId === currentUser.id
      if (!isOwnerViewing && (item.quantity ?? 0) <= 0) {
        return false
      }
      const matchesSearch = item.title.toLowerCase().includes(normalizedSearch)
      const matchesCategory =
        selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase()
      const matchesCondition =
        filterCondition === "all" || item.condition.toLowerCase() === filterCondition.toLowerCase()
      return matchesSearch && matchesCategory && matchesCondition
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime()
      }
      if (sortBy === "rating") {
        return b.lender.rating - a.lender.rating
      }
      if (sortBy === "name") {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return sorted
  }, [currentUser?.id, filterCondition, items, searchQuery, selectedCategory, sortBy])

  const isEditingListing = Boolean(editingItemId)
  const borrowerRequestsForCurrentUser = useMemo(() => {
    if (!currentUser) return []
    return borrowRequests.filter((req) => req.borrowerId === currentUser.id)
  }, [borrowRequests, currentUser])

  const activeBorrowRequestsByItem = useMemo(() => {
    const map = new Map<string, BorrowRequest>()
    borrowerRequestsForCurrentUser.forEach((req) => {
      if (req.status === "pending" || req.status === "approved") {
        map.set(req.itemId, req)
      }
    })
    return map
  }, [borrowerRequestsForCurrentUser])

  const lenderRequestsForCurrentUser = useMemo(() => {
    if (!currentUser) return []
    return borrowRequests.filter((req) => req.ownerId === currentUser.id)
  }, [borrowRequests, currentUser])

  const pendingLenderRequests = useMemo(
    () => lenderRequestsForCurrentUser.filter((req) => req.status === "pending").length,
    [lenderRequestsForCurrentUser],
  )

  const baseRecentActivity = useMemo<ActivityEntry[]>(
    () => [
      {
        id: "act-1",
        type: "request",
        title: "Share an item to get started",
        description: "List an item so fellow Spartans can reach out to you",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "Tip",
      },
      {
        id: "act-2",
        type: "rating",
        title: "Collect reviews",
        description: "Complete transactions to build your reputation",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "Tip",
      },
    ],
    [],
  )

  const recentActivity = useMemo<ActivityEntry[]>(() => {
    const activity: ActivityEntry[] = lenderRequestsForCurrentUser.map((req) => ({
      id: `lender-${req.id}`,
      type: "request",
      title: `Request for ${req.itemTitle}`,
      description: `${req.borrowerName} would like to borrow on ${req.preferredDate}`,
      date: req.requestDate,
      status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
    }))

    borrowerRequestsForCurrentUser.forEach((req) => {
      const statusLabel = req.status.charAt(0).toUpperCase() + req.status.slice(1)
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
      return baseRecentActivity
    }

    return [...activity, ...baseRecentActivity].slice(0, 6)
  }, [baseRecentActivity, borrowerRequestsForCurrentUser, lenderRequestsForCurrentUser])

  useEffect(() => {
    if (userMode !== "requests") return
    setRequestsView((prev) => {
      if (prev === "lender" && lenderRequestsForCurrentUser.length > 0) return prev
      if (prev === "borrower" && borrowerRequestsForCurrentUser.length > 0) return prev
      if (lenderRequestsForCurrentUser.length > 0) return "lender"
      return "borrower"
    })
  }, [
    userMode,
    borrowerRequestsForCurrentUser.length,
    lenderRequestsForCurrentUser.length,
  ])

  useEffect(() => {
    if (userMode === "requests" && requestsView === "lender") {
      setLenderNotification(null)
    }
  }, [requestsView, userMode])

  const handleLogin = (user: AuthUser) => {
    setCurrentUser({
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      fullName: user.fullName,
      name: user.fullName || user.email,
      email: user.email,
      rating: 0,
      itemsLent: 0,
      itemsBorrowed: 0,
      joinDate: user.createdAt ? new Date(user.createdAt) : new Date(),
      trustScore: 85,
    })
    setIsAuthenticated(true)
    setShowSignInModal(false)
    setShowRegisterModal(false)
    setUserMode("dashboard")
  }

  const handleLogout = () => {
    supabase.auth.signOut().catch((err) => console.error("Failed to sign out", err))
    setIsAuthenticated(false)
    setCurrentUser(null)
    setUserMode("dashboard")
  }

  const handleItemClick = (item: MarketplaceItem) => {
    setSelectedItem(item)
    setShowItemDetail(true)
  }

  const handleDeleteItemRequest = (item: MarketplaceItem) => {
    if (!currentUser || item.ownerId !== currentUser.id) {
      showBanner("You can only delete listings you created.", "error")
      return
    }

    setDeleteItemError(null)
    setPendingDeleteItem(item)
  }

  const handleCancelDeleteItem = () => {
    if (isProcessingDelete) {
      return
    }

    setPendingDeleteItem(null)
    setDeleteItemError(null)
  }

  const handleConfirmDeleteItem = async () => {
    if (!pendingDeleteItem || !currentUser) {
      setDeleteItemError("You can only delete listings you created.")
      return
    }

    if (pendingDeleteItem.ownerId !== currentUser.id) {
      setDeleteItemError("You can only delete listings you created.")
      return
    }

    const item = pendingDeleteItem
    setDeleteItemError(null)
    setIsProcessingDelete(true)
    setDeletingItemId(item.id)

    try {
      const numericId = Number(item.id)
      const query = supabase.from("items").delete().eq("owner_id", currentUser.id)
      const { error } = Number.isFinite(numericId)
        ? await query.eq("id", numericId)
        : await query.eq("id", item.id)

      if (error) {
        console.error("Failed to delete item", error)
        setDeleteItemError(error.message ?? "Failed to delete listing. Please try again.")
        return
      }

      setPendingDeleteItem(null)

      setRemovingItemIds((prev) => {
        const next = new Set(prev)
        next.add(item.id)
        return next
      })

      window.setTimeout(() => {
        setItems((prev) => prev.filter((existing) => existing.id !== item.id))
        setRemovingItemIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, removalAnimationMs)

      let shouldCloseDetail = false
      setSelectedItem((prev) => {
        if (prev && prev.id === item.id) {
          shouldCloseDetail = true
          return null
        }
        return prev
      })
      if (shouldCloseDetail) {
        setShowItemDetail(false)
      }

      if (editingItemId === item.id) {
        resetListItemState()
        setUserMode("browse")
      }

      setListItemSuccess(null)
      showBanner(`Listing for "${item.title}" deleted.`, "success")
    } catch (err) {
      console.error("Unexpected error while deleting item", err)
      setDeleteItemError(
        err instanceof Error ? err.message : "Unexpected error occurred while deleting the listing.",
      )
    } finally {
      setDeletingItemId((prev) => (prev === item.id ? null : prev))
      setIsProcessingDelete(false)
    }
  }

  const handleRequestBorrow = () => {
    if (!selectedItem) return
    if (currentUser && selectedItem.ownerId === currentUser.id) {
      return
    }
    if (currentUser) {
      const activeRequest = activeBorrowRequestsByItem.get(selectedItem.id)
      if (activeRequest) {
        showBanner("You already have an active request for this item. Please wait for the lender to respond.", "info")
        return
      }
    }
    setRequestError(null)
    setShowRequestModal(true)
  }

  const handleSubmitRequest = async (data: { date: string; message: string }): Promise<boolean> => {
    if (!currentUser || !selectedItem) {
      console.error("Attempted to submit a borrow request without an active user or selected item.")
      return false
    }

    const hasActiveRequest = borrowRequests.some(
      (request) =>
        request.itemId === selectedItem.id &&
        request.borrowerId === currentUser.id &&
        (request.status === "pending" || request.status === "approved"),
    )

    if (hasActiveRequest) {
      setRequestError("You already have an active request for this item. Please wait for the lender to respond.")
      return false
    }

    let lenderEmail = selectedItem.lender.email ?? null

    if (!lenderEmail) {
      try {
        const { data: itemRecord, error: itemError } = await supabase
          .from("items")
          .select("lender_email, owner_email")
          .eq("id", selectedItem.id)
          .maybeSingle()

        if (!itemError && itemRecord) {
          lenderEmail = itemRecord.lender_email ?? itemRecord.owner_email ?? null
        }
      } catch (lookupError) {
        console.error("Failed to look up lender email", lookupError)
      }
    }

    const payload = {
      item_id: selectedItem.id,
      item_title: selectedItem.title,
      item_image: selectedItem.image ?? null,
      borrower_id: currentUser.id,
      borrower_name: currentUser.name,
      borrower_email: currentUser.email ?? "",
      borrower_rating: currentUser.rating ?? 0,
      preferred_date: data.date,
      message: data.message,
      status: "pending",
      owner_id: selectedItem.ownerId ?? null,
      lender_name: selectedItem.lender.name,
      lender_email: lenderEmail,
      decision_message: null,
    }

    try {
      const { data: inserted, error } = await supabase
        .from("borrow_requests")
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error("Failed to submit borrow request", error)
        setRequestError(error.message ?? "Failed to submit request. Please try again.")
        return false
      }

      if (inserted) {
        const mapped = mapBorrowRequestRecord(inserted)
        const enriched = !mapped.lenderEmail && lenderEmail ? { ...mapped, lenderEmail } : mapped
        setBorrowRequests((prev) => [enriched, ...prev.filter((req) => req.id !== enriched.id)])
        setRequestError(null)
  showBanner(`Request submitted for ${enriched.itemTitle} on ${enriched.preferredDate}.`, "success")
        setShowRequestModal(false)
        setRequestsView("borrower")

        const emailTarget = enriched.lenderEmail || lenderEmail
        if (emailTarget) {
          void sendLenderEmailNotification({
            email: emailTarget,
            itemTitle: enriched.itemTitle,
            borrowerName: enriched.borrowerName,
            preferredDate: enriched.preferredDate,
            message: enriched.message || "",
          })
        }

        return true
      }
    } catch (err) {
      console.error("Unexpected error while submitting borrow request", err)
      setRequestError(
        err instanceof Error ? err.message : "Unexpected error occurred while submitting the borrow request.",
      )
    }

    return false
  }

  const handleApproveRequest = async (requestId: string, responseMessage?: string) => {
    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .update({ status: "approved", decision_message: responseMessage ?? null })
        .eq("id", requestId)
        .select()
        .single()

      if (error) {
        console.error("Failed to approve borrow request", error)
        showBanner("Failed to approve the request. Please try again.", "error")
        return
      }

      if (data) {
        const mapped = mapBorrowRequestRecord(data)
        setBorrowRequests((prev) => prev.map((req) => (req.id === mapped.id ? mapped : req)))
        setShowScheduleModal(true)

        if (mapped.borrowerEmail) {
          void sendBorrowerEmailNotification({
            email: mapped.borrowerEmail,
            itemTitle: mapped.itemTitle,
            borrowerName: mapped.borrowerName,
            lenderName: mapped.lenderName,
            preferredDate: mapped.preferredDate,
            decisionMessage: responseMessage ?? mapped.decisionMessage ?? null,
            notificationType: "approval",
          })
        }
      }
    } catch (err) {
      console.error("Unexpected error while approving borrow request", err)
      showBanner("An unexpected error occurred while approving the request.", "error")
    }
  }

  const handleRejectRequest = async (requestId: string, responseMessage?: string) => {
    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .update({ status: "rejected", decision_message: responseMessage ?? null })
        .eq("id", requestId)
        .select()
        .single()

      if (error) {
        console.error("Failed to reject borrow request", error)
        showBanner("Failed to reject the request. Please try again.", "error")
        return
      }

      if (data) {
        const mapped = mapBorrowRequestRecord(data)
        setBorrowRequests((prev) => prev.map((req) => (req.id === mapped.id ? mapped : req)))

        if (mapped.borrowerEmail) {
          void sendBorrowerEmailNotification({
            email: mapped.borrowerEmail,
            itemTitle: mapped.itemTitle,
            borrowerName: mapped.borrowerName,
            lenderName: mapped.lenderName,
            preferredDate: mapped.preferredDate,
            decisionMessage: responseMessage ?? mapped.decisionMessage ?? null,
            notificationType: "rejection",
          })
        }
      }
    } catch (err) {
      console.error("Unexpected error while rejecting borrow request", err)
      showBanner("An unexpected error occurred while rejecting the request.", "error")
    }
  }

  const handleCompleteRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .update({ status: "completed" })
        .eq("id", requestId)
        .select()
        .single()

      if (error) {
        console.error("Failed to mark borrow request as completed", error)
        showBanner("Failed to mark the request as completed. Please try again.", "error")
        return
      }

      if (data) {
        const mapped = mapBorrowRequestRecord(data)
        setBorrowRequests((prev) => prev.map((req) => (req.id === mapped.id ? mapped : req)))
      }
    } catch (err) {
      console.error("Unexpected error while completing borrow request", err)
      showBanner("An unexpected error occurred while completing the request.", "error")
    }
  }

  const handleCreateSchedule = (data: { startDate: string; endDate: string }) => {
    const approvedRequest = borrowRequests.find((r) => r.status === "approved")
    if (approvedRequest) {
      const timestamp = Date.now()
      const borrowerSlug = approvedRequest.borrowerName.replace(/\s+/g, "-").toLowerCase()
      const lenderName = approvedRequest.lenderName || currentUser?.name || "Lender"
      const lenderSlug = lenderName.replace(/\s+/g, "-").toLowerCase()
      const newSchedule: BorrowSchedule = {
        id: `sched-${timestamp}`,
        itemId: approvedRequest.itemId,
        itemTitle: approvedRequest.itemTitle,
        borrowerName: approvedRequest.borrowerName,
        lenderName,
        borrowerQRCode: `borrower-${borrowerSlug}-${timestamp}`,
        lenderQRCode: `lender-${lenderSlug}-${timestamp}`,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "awaiting_handoff",
        returnReady: false,
      }
      setBorrowSchedules((prev) => [...prev, newSchedule])
      void updateItemQuantity(approvedRequest.itemId, -1)
      setShowScheduleModal(false)
      showBanner("Schedule created successfully!", "success")
    }
  }

  const handleListItemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUser) {
      setListItemError("Please sign in to list an item.")
      setListItemSuccess(null)
      return
    }

    const trimmedTitle = listItemForm.title.trim()
    if (!trimmedTitle) {
      setListItemError("Item title is required.")
      setListItemSuccess(null)
      return
    }

    setListItemError(null)
    setListItemSuccess(null)
    setIsSubmittingItem(true)

    const safeQuantity = Number.isFinite(Number(listItemForm.quantity)) && Number(listItemForm.quantity) > 0
      ? Math.floor(Number(listItemForm.quantity))
      : 1

    try {
      let finalImageUrl: string | null = listItemExistingImage
      const isEditing = Boolean(editingItemId)

      if (listItemForm.imageFile) {
        const bucket = "item-images"
        const file = listItemForm.imageFile
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
        const filePath = `${currentUser.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        })

        if (uploadError) {
          console.error("Failed to upload item image", uploadError)
          setListItemError(uploadError.message)
          return
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
        finalImageUrl = publicUrlData.publicUrl
      }

      const commonPayload = {
        title: trimmedTitle,
        category: listItemForm.category,
        condition: listItemForm.condition,
        description: listItemForm.description.trim(),
        campus: listItemForm.campus,
        deposit_required: listItemForm.deposit,
        image_url: finalImageUrl,
        quantity: safeQuantity,
      }

      const query = supabase.from("items")

      const { data, error } = isEditing
        ? await query
            .update({
              ...commonPayload,
              lender_name: currentUser.fullName || currentUser.name,
              lender_rating: currentUser.rating ?? 5,
              lender_reviews: currentUser.itemsLent ?? 0,
              lender_email: currentUser.email ?? null,
            })
            .eq("id", editingItemId)
            .eq("owner_id", currentUser.id)
            .select()
            .single()
        : await query
            .insert({
              ...commonPayload,
              availability: "Available",
              lender_name: currentUser.fullName || currentUser.name,
              lender_rating: currentUser.rating ?? 5,
              lender_reviews: currentUser.itemsLent ?? 0,
              owner_id: currentUser.id,
              lender_email: currentUser.email ?? null,
            })
            .select()
            .single()

      if (error) {
        console.error(isEditing ? "Failed to update item" : "Failed to list item", error)
        setListItemError(error.message)
        return
      }

      if (data) {
        const mappedItem = mapItemRecord(data)
        setItems((prev) =>
          isEditing ? prev.map((item) => (item.id === mappedItem.id ? mappedItem : item)) : [mappedItem, ...prev],
        )
        if (selectedItem && selectedItem.id === mappedItem.id) {
          setSelectedItem(mappedItem)
        }
        setListItemSuccess(isEditing ? "Item updated successfully!" : "Item listed successfully!")
        resetListItemState()
        if (userMode !== "browse") {
          setUserMode("browse")
        }
      }
    } catch (err) {
      console.error("Unexpected error while saving item", err)
      setListItemError(err instanceof Error ? err.message : "Unexpected error occurred while saving the item")
    } finally {
      setIsSubmittingItem(false)
    }
  }

  const startEditingItem = (item: MarketplaceItem) => {
    if (!currentUser || item.ownerId !== currentUser.id) {
      setListItemError("You can only edit listings you created.")
      setListItemSuccess(null)
      return
    }
    setEditingItemId(item.id)
    setListItemForm({
      title: item.title,
      category: item.category,
      condition: item.condition,
      description: item.description ?? "",
      campus: item.campus,
      quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      deposit: Boolean(item.deposit),
      imageFile: null,
    })
    setListItemExistingImage(item.image ?? null)
    setImagePreviewUrl(item.image ?? null)
    setListItemError(null)
    setListItemSuccess(null)
    setUserMode("lend")
    setShowItemDetail(false)
  }

  const handleCancelEdit = () => {
    resetListItemState()
    setListItemError(null)
    setListItemSuccess(null)
    setShowItemDetail(false)
    setUserMode("browse")
  }

  const handleGenerateQR = (schedule: BorrowSchedule, qrType: "borrower" | "lender") => {
    let updatedSchedule = schedule
    setBorrowSchedules((prev) =>
      prev.map((sched) => {
        if (sched.id !== schedule.id) return sched
        updatedSchedule = qrType === "lender" ? { ...sched, returnReady: true } : { ...sched }
        return updatedSchedule
      }),
    )
    setSelectedQRCode({ schedule: updatedSchedule, type: qrType })
  }

  const handleScanQR = (schedule: BorrowSchedule, type: "handoff" | "return") => {
    setSelectedSchedule(schedule)
    setScanType(type)
    setScannerError(null)
    setShowQRScanner(true)
  }

  const handleQRScanComplete = (scannedData: string): boolean => {
    if (!selectedSchedule || !scanType) return false

    const expectedCode = scanType === "handoff" ? selectedSchedule.borrowerQRCode : selectedSchedule.lenderQRCode

    if (scannedData !== expectedCode) {
      setScannerError(
        scanType === "handoff"
          ? "Scanned code does not match the borrower's QR. Please try again."
          : "Scanned code does not match the lender's return QR. Please try again.",
      )
      return false
    }

    setScannerError(null)
    const scheduleItemId = selectedSchedule.itemId

    if (scanType === "handoff") {
      setBorrowSchedules((prev) =>
        prev.map((sched) =>
          sched.id === selectedSchedule.id
            ? { ...sched, status: "borrowed" as const, returnReady: false }
            : sched,
        ),
      )
      showBanner(
        `Handoff confirmed for ${selectedSchedule.itemTitle}. Status updated to Borrowed.`,
        "success",
      )
    } else {
      setBorrowSchedules((prev) =>
        prev.map((sched) =>
          sched.id === selectedSchedule.id ? { ...sched, status: "completed" as const, returnReady: false } : sched,
        ),
      )
      void updateItemQuantity(scheduleItemId, 1)
      showBanner(`Item return confirmed. Transaction completed with ${selectedSchedule.borrowerName}.`, "success")
      const relatedRequest = borrowRequests.find(
        (request) =>
          request.itemId === selectedSchedule.itemId && request.borrowerName === selectedSchedule.borrowerName,
      )
      openRatingModal({
        requestId: relatedRequest?.id,
        targetUserId: relatedRequest?.borrowerId ?? null,
        targetUserName: selectedSchedule.borrowerName,
        itemTitle: selectedSchedule.itemTitle,
        direction: "lenderToBorrower",
        existingRating: relatedRequest?.lenderFeedbackRating ?? null,
        existingReview: relatedRequest?.lenderFeedbackMessage ?? null,
      })
    }

    setShowQRScanner(false)
    setSelectedSchedule(null)
    setScanType(null)
    return true
  }

  const handleMarkScheduleComplete = (scheduleId: string) => {
    setBorrowSchedules((prev) =>
      prev.map((sched) =>
        sched.id === scheduleId ? { ...sched, status: "completed" as const, returnReady: false } : sched,
      ),
    )
    const completedSchedule = borrowSchedules.find((s) => s.id === scheduleId)
    if (completedSchedule) {
      void updateItemQuantity(completedSchedule.itemId, 1)
      const matchingRequest = borrowRequests.find(
        (request) =>
          request.itemId === completedSchedule.itemId && request.borrowerName === completedSchedule.borrowerName,
      )
      openRatingModal({
        requestId: matchingRequest?.id,
        targetUserId: matchingRequest?.borrowerId ?? null,
        targetUserName: completedSchedule.borrowerName,
        itemTitle: completedSchedule.itemTitle,
        direction: "lenderToBorrower",
        existingRating: matchingRequest?.lenderFeedbackRating ?? null,
        existingReview: matchingRequest?.lenderFeedbackMessage ?? null,
      })
    }
  }

  const handleOpenRequestRating = (request: BorrowRequest, role: "borrower" | "lender") => {
    const direction: RatingDirection = role === "borrower" ? "borrowerToLender" : "lenderToBorrower"
    openRatingModal({
      requestId: request.id,
      targetUserId: role === "borrower" ? request.ownerId : request.borrowerId,
      targetUserName: role === "borrower" ? request.lenderName : request.borrowerName,
      itemTitle: request.itemTitle,
      direction,
      existingRating:
        direction === "borrowerToLender" ? request.borrowerFeedbackRating ?? null : request.lenderFeedbackRating ?? null,
      existingReview:
        direction === "borrowerToLender"
          ? request.borrowerFeedbackMessage ?? null
          : request.lenderFeedbackMessage ?? null,
    })
  }

  const handleSubmitRating = async (data: { rating: number; review: string }) => {
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
    }

  const bannerStyles = {
    success: {
      border: "border-emerald-500/50",
      background: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-100",
      button: "text-emerald-700 hover:text-emerald-900 dark:text-emerald-100 dark:hover:text-emerald-50",
    },
    error: {
      border: "border-red-500/50",
      background: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-100",
      button: "text-red-700 hover:text-red-900 dark:text-red-100 dark:hover:text-red-50",
    },
    info: {
      border: "border-primary/40",
      background: "bg-primary/5",
      text: "text-primary",
      button: "text-primary hover:text-primary/80",
    },
  } as const

  const bannerIconMap = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
  } as const

  const activeBannerStyles = uiBanner ? bannerStyles[uiBanner.type] : null
  const ActiveBannerIcon = uiBanner ? bannerIconMap[uiBanner.type] : null

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setShowSignInModal(true)}
        userMode={userMode}
        onModeChange={setUserMode}
        pendingLenderRequests={pendingLenderRequests}
      />

      <main className="container mx-auto px-4 py-8">
        {uiBanner && activeBannerStyles && ActiveBannerIcon && (
          <div
            className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 ${activeBannerStyles.border} ${activeBannerStyles.background}`}
            role="status"
            aria-live="polite"
          >
            <div className={`flex items-center gap-2 text-sm ${activeBannerStyles.text}`}>
              <ActiveBannerIcon size={18} className="shrink-0" />
              <span>{uiBanner.message}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`${activeBannerStyles.button} text-sm`}
              onClick={() => setUiBanner(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="text-center py-16">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-primary mb-4">Lend-A-Spartan</h1>
              <p className="text-xl text-muted-foreground mb-8">Share and borrow items with your BatStateU community</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => { setShowSignInModal(true); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sign In
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowRegisterModal(true)}>
                Register
              </Button>
            </div>
          </div>
        ) : (
          <>
            {lenderNotification && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-3">
                <span className="text-sm text-primary">{lenderNotification}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary"
                  onClick={() => setLenderNotification(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}
            {userMode === "dashboard" ? (
              <Dashboard
                currentUser={currentUser}
                pendingRequests={pendingLenderRequests}
                activeSchedules={
                  borrowSchedules.filter(
                    (s) => s.status === "awaiting_handoff" || s.status === "borrowed",
                  ).length
                }
                completedTransactions={borrowSchedules.filter((s) => s.status === "completed").length}
                recentActivity={recentActivity}
                onNavigate={setUserMode}
              />
            ) : userMode === "browse" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Browse Items</h2>
                  <SearchFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    filterCondition={filterCondition}
                    onConditionChange={setFilterCondition}
                    showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                  />
                </div>

                {itemsError && <p className="text-sm text-red-600 mb-4">{itemsError}</p>}
                {deleteItemError && !pendingDeleteItem && (
                  <p className="text-sm text-red-600 mb-4">{deleteItemError}</p>
                )}

                <ItemsGrid
                  items={filteredAndSortedItems}
                  onItemClick={handleItemClick}
                  isLoading={itemsLoading}
                  currentUserId={currentUser?.id ?? null}
                  deletingItemId={deletingItemId}
                  onDeleteItem={handleDeleteItemRequest}
                  removingItemIds={removingItemIds}
                />
              </>
            ) : userMode === "requests" ? (
              <>
                <div className="mb-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
                      <Inbox size={32} />
                      Requests Center
                    </h2>
                    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={requestsView === "borrower" ? "default" : "ghost"}
                        className="text-sm"
                        onClick={() => setRequestsView("borrower")}
                      >
                        As Borrower
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={requestsView === "lender" ? "default" : "ghost"}
                        className="text-sm"
                        onClick={() => setRequestsView("lender")}
                      >
                        As Lender
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {requestsView === "borrower"
                      ? "Track the items you've asked to borrow and monitor their status."
                      : "Review incoming requests for your listed items and respond quickly to keep things moving."}
                  </p>
                </div>
                <RequestsDashboard
                  requests={requestsView === "borrower" ? borrowerRequestsForCurrentUser : lenderRequestsForCurrentUser}
                  currentUserRole={requestsView}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onComplete={handleCompleteRequest}
                  onOpenRating={handleOpenRequestRating}
                />
              </>
            ) : userMode === "schedule" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Calendar size={32} />
                    Borrowing Schedule
                  </h2>
                </div>
                <BorrowScheduleComponent
                  schedules={borrowSchedules}
                  currentUserName={currentUser?.name || ""}
                  onGenerateQR={handleGenerateQR}
                  onScanQR={handleScanQR}
                  forceAllActions
                />
              </>
            ) : userMode === "profile" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <User size={32} />
                    My Profile
                  </h2>
                </div>
                <UserProfile
                  userName={currentUser.name}
                  rating={ratingStats.overallAverage}
                  totalReviews={ratingStats.totalCount}
                  itemsLent={currentUser.itemsLent}
                  itemsBorrowed={currentUser.itemsBorrowed}
                  joinDate={currentUser.joinDate}
                  reviews={receivedReviews}
                  trustScore={currentUser.trustScore}
                  lenderRating={ratingStats.asLender.average}
                  lenderReviewCount={ratingStats.asLender.count}
                  borrowerRating={ratingStats.asBorrower.average}
                  borrowerReviewCount={ratingStats.asBorrower.count}
                />
              </>
            ) : (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-foreground mb-6">List an Item to Lend</h2>
                <Card className="p-6 border border-border">
                  <form className="space-y-4" onSubmit={handleListItemSubmit}>
                    {isEditingListing && (
                      <div className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
                        <div className="font-medium">You&apos;re editing an existing listing.</div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-primary/80">
                          <span>Adjust the item details and save to publish your changes.</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="text-primary hover:text-primary"
                          >
                            Cancel edit
                          </Button>
                        </div>
                      </div>
                    )}
                    {listItemError && <p className="text-sm text-red-600">{listItemError}</p>}
                    {listItemSuccess && <p className="text-sm text-green-600">{listItemSuccess}</p>}
                    <div>
                      <label className="block text-sm font-medium mb-2">Item Title</label>
                      <Input
                        value={listItemForm.title}
                        onChange={(event) =>
                          setListItemForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                        placeholder="e.g., Laptop Stand"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        value={listItemForm.category}
                        onChange={(event) =>
                          setListItemForm((prev) => ({ ...prev, category: event.target.value }))
                        }
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="School Supplies">School Supplies</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Books">Books</option>
                        <option value="Sports">Sports</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        rows={4}
                        placeholder="Describe the item condition and details..."
                        value={listItemForm.description}
                        onChange={(event) =>
                          setListItemForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Quantity</label>
                        <Input
                          type="number"
                          min={1}
                          value={listItemForm.quantity}
                          onChange={(event) =>
                            setListItemForm((prev) => ({
                              ...prev,
                              quantity: Number.isFinite(Number(event.target.value))
                                ? Math.max(1, Math.floor(Number(event.target.value)))
                                : prev.quantity,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Condition</label>
                        <select
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          value={listItemForm.condition}
                          onChange={(event) =>
                            setListItemForm((prev) => ({ ...prev, condition: event.target.value }))
                          }
                        >
                          <option value="Like New">Like New</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Campus / Location</label>
                      <Input
                        placeholder="e.g., Main Campus"
                        value={listItemForm.campus}
                        onChange={(event) =>
                          setListItemForm((prev) => ({ ...prev, campus: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Item Image (optional)</label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null
                          setListItemForm((prev) => ({ ...prev, imageFile: file }))
                          if (!file) {
                            setImagePreviewUrl(isEditingListing ? listItemExistingImage : null)
                            event.target.value = ""
                            return
                          }
                          setImagePreviewUrl((prev) => {
                            if (prev && prev.startsWith("blob:")) {
                              URL.revokeObjectURL(prev)
                            }
                            return file ? URL.createObjectURL(file) : null
                          })
                          event.target.value = ""
                        }}
                      />
                      {imagePreviewUrl && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Preview</p>
                          <img
                            src={imagePreviewUrl}
                            alt="Selected item preview"
                            className="w-full h-48 object-cover rounded border border-border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="deposit"
                        className="rounded"
                        checked={listItemForm.deposit}
                        onChange={(event) =>
                          setListItemForm((prev) => ({ ...prev, deposit: event.target.checked }))
                        }
                      />
                      <label htmlFor="deposit" className="text-sm">
                        Require deposit for this item
                      </label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={isSubmittingItem}
                    >
                      {isEditingListing ? <Save size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
                      {isSubmittingItem
                        ? isEditingListing
                          ? "Saving..."
                          : "Listing..."
                        : isEditingListing
                          ? "Save Changes"
                          : "List Item"}
                    </Button>
                  </form>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setShowSignInModal(false)
          setShowRegisterModal(true)
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegister={handleLogin}
        onSwitchToSignIn={() => {
          setShowRegisterModal(false)
          setShowSignInModal(true)
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteItem)}
        itemTitle={pendingDeleteItem?.title}
        onCancel={handleCancelDeleteItem}
        onConfirm={handleConfirmDeleteItem}
        isLoading={isProcessingDelete}
        errorMessage={deleteItemError}
      />

      {selectedItem && (
        <ItemDetailModal
          isOpen={showItemDetail}
          onClose={() => setShowItemDetail(false)}
          item={selectedItem}
          onRequestBorrow={handleRequestBorrow}
          canEdit={Boolean(currentUser && selectedItem.ownerId === currentUser.id)}
          onEdit={() => startEditingItem(selectedItem)}
          canRequestBorrow={
            !currentUser ||
            (selectedItem.ownerId !== currentUser.id && !activeBorrowRequestsByItem.get(selectedItem.id))
          }
          requestDisabledReason={
            !currentUser
              ? undefined
              : selectedItem.ownerId === currentUser.id
                ? "You listed this item. Borrowers will see the request button here."
                : activeBorrowRequestsByItem.get(selectedItem.id)
                  ? "You already have an active request for this item."
                  : undefined
          }
        />
      )}

      {selectedItem && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          item={selectedItem}
          onSubmit={handleSubmitRequest}
          errorMessage={requestError}
        />
      )}

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        itemTitle={borrowRequests.find((r) => r.status === "approved")?.itemTitle || ""}
        borrowerName={borrowRequests.find((r) => r.status === "approved")?.borrowerName || ""}
        onSubmit={handleCreateSchedule}
      />

      {selectedQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <QRCodeGenerator
              data={
                selectedQRCode.type === "borrower"
                  ? selectedQRCode.schedule.borrowerQRCode
                  : selectedQRCode.schedule.lenderQRCode
              }
              title={
                selectedQRCode.type === "borrower"
                  ? `Borrower QR - ${selectedQRCode.schedule.borrowerName}`
                  : `Return QR - ${selectedQRCode.schedule.lenderName}`
              }
              onClose={() => setSelectedQRCode(null)}
            />
          </div>
        </div>
      )}

      {showQRScanner && selectedSchedule && (
        <QRScanner
          onScan={handleQRScanComplete}
          onClose={() => {
            setShowQRScanner(false)
            setSelectedSchedule(null)
            setScanType(null)
            setScannerError(null)
          }}
          title={scanType === "handoff" ? "Scan Borrower's QR Code" : "Scan Lender's Return QR"}
          description={
            scanType === "handoff"
              ? `Ask ${selectedSchedule.borrowerName} to show their QR code so you can confirm the handoff.`
              : `Ask ${selectedSchedule.lenderName} to show their QR code so you can confirm the return.`
          }
          validationError={scannerError}
          onClearValidationError={() => setScannerError(null)}
        />
      )}

      <RatingModal
        isOpen={showRatingModal}
        onClose={closeRatingModal}
        userName={ratingContext?.targetUserName || ""}
        itemTitle={ratingContext?.itemTitle || ""}
        initialRating={ratingContext?.existingRating ?? null}
        initialReview={ratingContext?.existingReview ?? ""}
        onSubmit={handleSubmitRating}
      />
    </div>
  )
}
