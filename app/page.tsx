"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import ItemDetailModal from "@/components/item-detail-modal"
import RequestModal from "@/components/request-modal"
import ScheduleModal from "@/components/schedule-modal"
import QRCodeGenerator from "@/components/qr-code-generator"
import QRScanner from "@/components/qr-scanner"
import RatingModal from "@/components/rating-modal"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { DashboardView } from "@/components/views/dashboard-view"
import { BrowseView } from "@/components/views/browse-view"
import { RequestsView } from "@/components/views/requests-view"
import { ProfileView } from "@/components/views/profile-view"
import { ScheduleView } from "@/components/views/schedule-view"
import { LendView } from "@/components/views/lend-view"
import { LandingPage } from "@/components/views/landing-page"
import { AuthModals } from "@/components/views/auth-modals"
import { supabase } from "@/lib/supabaseclient"
import { slugify, summarizeSupabaseError } from "@/lib/home-utils"
import { mapBorrowRequestRecord, mapBorrowScheduleRecord } from "@/lib/mappers"
import { sendBorrowerEmailNotification, sendLenderEmailNotification } from "@/lib/notifications"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useDashboardBanner } from "@/hooks/useDashboardBanner"
import { useItemsFeature } from "@/hooks/useItemsFeature"
import { useRatingsFeature } from "@/hooks/useRatingsFeature"
import { useBorrowRequests } from "@/hooks/useBorrowRequests"
import { useBorrowSchedules } from "@/hooks/useBorrowSchedules"
import {
  buildActiveBorrowRequestsByItem,
  countPendingRequests,
  getBorrowerRequestsForUser,
  getLenderRequestsForUser,
} from "@/lib/request-utils"
import {
  buildDashboardMetrics,
  buildRecentActivity,
  calculateRatingStats,
  calculateUserItemCounts,
  collectReceivedReviews,
} from "@/lib/dashboard-utils"
import { bannerStyles, bannerIconMap } from "@/lib/banner-styles"
import type { AuthUser } from "@/types/auth"
import type {
  ActivityEntry,
  BorrowRequest,
  BorrowSchedule,
  DashboardMetricSummary,
  DashboardRole,
  MarketplaceItem,
  RatingDirection,
  UserMode,
  UserReview,
} from "@/types/interfaces"

const USER_MODE_STORAGE_KEY = "las:userMode"
const REQUESTS_VIEW_STORAGE_KEY = "las:requestsView"

const resolveStoredUserMode = () => {
  if (typeof window === "undefined") {
    return "dashboard" as UserMode
  }

  const stored = window.localStorage.getItem(USER_MODE_STORAGE_KEY)
  const allowedModes: UserMode[] = ["dashboard", "browse", "lend", "requests", "schedule", "profile"]
  return stored && allowedModes.includes(stored as UserMode) ? (stored as UserMode) : ("dashboard" as UserMode)
}

const resolveStoredRequestsView = (): "borrower" | "lender" | null => {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(REQUESTS_VIEW_STORAGE_KEY)
  return stored === "borrower" || stored === "lender" ? stored : null
}

export default function Home() {
  const {
    isAuthenticated,
    currentUser,
    handleLogin: authHandleLogin,
    handleLogout: authHandleLogout,
    setCurrentUser,
  } = useAuthSession()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [userMode, setUserMode] = useState<UserMode>(resolveStoredUserMode)
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
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const storedRequestsViewRef = useRef<"borrower" | "lender" | null>(null)
  const [requestsView, setRequestsView] = useState<"borrower" | "lender">(() => {
    const stored = resolveStoredRequestsView()
    storedRequestsViewRef.current = stored
    return stored ?? "borrower"
  })
  const autoSelectedRequestsViewRef = useRef(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [lenderNotification, setLenderNotification] = useState<string | null>(null)
  const { uiBanner, showBanner, dismissBanner } = useDashboardBanner()

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(USER_MODE_STORAGE_KEY, userMode)
  }, [userMode])

  const {
    items,
    setItems,
    itemsLoading,
    itemsError,
    updateItemQuantity,
    showItemDetail,
    setShowItemDetail,
    selectedItem,
    setSelectedItem,
    handleItemClick,
    deleteItemError,
    deletingItemId,
    pendingDeleteItem,
    isProcessingDelete,
    removingItemIds,
    handleDeleteItemRequest,
    handleCancelDeleteItem,
    handleConfirmDeleteItem,
    listItemForm,
    setListItemForm,
    imagePreviewUrl,
    setImagePreviewUrl,
    listItemExistingImage,
    isSubmittingItem,
    listItemError,
    listItemSuccess,
    handleListItemSubmit,
    startEditingItem,
    handleCancelEdit,
    editingItemId,
    resetListItemState,
  } = useItemsFeature({ currentUser, showBanner, userMode, setUserMode })

  const previousRequestIdsRef = useRef<Set<string>>(new Set())
  const profileRatingSyncRef = useRef<number | null | undefined>(undefined)
  const [scheduleDraftRequest, setScheduleDraftRequest] = useState<BorrowRequest | null>(null)

  const { borrowRequests, setBorrowRequests } = useBorrowRequests(currentUser?.id ?? null)

  const {
    borrowSchedules,
    setBorrowSchedules,
    requestStageOverrides,
    scheduleCards,
    refreshBorrowSchedules,
  } = useBorrowSchedules({ currentUserId: currentUser?.id ?? null, borrowRequests })

  const {
    showRatingModal,
    ratingContext,
    openRatingModal,
    closeRatingModal,
    handleSubmitRating,
  } = useRatingsFeature({ setBorrowRequests, showBanner })

  const scheduleModalContext = useMemo(() => {
    if (!scheduleDraftRequest) {
      return null
    }

    const coerce = (value?: string | null) => {
      if (!value) return ""
      const trimmed = value.trim()
      return trimmed
    }

    return {
      itemTitle: scheduleDraftRequest.itemTitle,
      borrowerName: scheduleDraftRequest.borrowerName,
      defaults: {
        startDate: coerce(scheduleDraftRequest.preferredDate),
        endDate: coerce(scheduleDraftRequest.returnDate) || coerce(scheduleDraftRequest.preferredDate),
        meetingPlace: coerce(scheduleDraftRequest.meetingPlace),
        meetingTime: coerce(scheduleDraftRequest.meetingTime),
      },
    }
  }, [scheduleDraftRequest])

  const receivedReviews = useMemo(
    () => collectReceivedReviews({ borrowRequests, currentUserId: currentUser?.id ?? null }),
    [borrowRequests, currentUser?.id],
  )

  const ratingStats = useMemo(
    () => calculateRatingStats(borrowRequests, currentUser?.id ?? null),
    [borrowRequests, currentUser?.id],
  )

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

    const syncedRating =
      ratingStats.totalCount > 0 && ratingStats.overallAverage !== null
        ? Number(ratingStats.overallAverage.toFixed(2))
        : null

    if (profileRatingSyncRef.current === syncedRating) return
    profileRatingSyncRef.current = syncedRating

    const storedRating = syncedRating ?? 0

    setItems((prev) =>
      prev.map((item) =>
        item.ownerId === currentUser.id
          ? { ...item, lender: { ...item.lender, rating: storedRating } }
          : item,
      ),
    )

    setSelectedItem((prev) =>
      prev && prev.ownerId === currentUser.id
        ? { ...prev, lender: { ...prev.lender, rating: storedRating } }
        : prev,
    )

    void supabase
      .from("profiles")
      .update({ rating: storedRating })
      .eq("id", currentUser.id)
      .then(({ error }) => {
        const message = summarizeSupabaseError(error)
        if (!message) return
        console.error("Failed to sync profile rating:", message)
      })

    void supabase
      .from("items")
      .update({ lender_rating: storedRating })
      .eq("owner_id", currentUser.id)
      .then(({ error }) => {
        const message = summarizeSupabaseError(error)
        if (!message) return
        console.error("Failed to sync item ratings:", message)
      })
  }, [currentUser?.id, ratingStats.overallAverage, ratingStats.totalCount])

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
  const borrowerRequestsForCurrentUser = useMemo(
    () => getBorrowerRequestsForUser(borrowRequests, currentUser?.id ?? null, requestStageOverrides),
    [borrowRequests, currentUser?.id, requestStageOverrides],
  )

  const activeBorrowRequestsByItem = useMemo(
    () => buildActiveBorrowRequestsByItem(borrowerRequestsForCurrentUser),
    [borrowerRequestsForCurrentUser],
  )

  const lenderRequestsForCurrentUser = useMemo(
    () => getLenderRequestsForUser(borrowRequests, currentUser?.id ?? null, requestStageOverrides),
    [borrowRequests, currentUser?.id, requestStageOverrides],
  )

  const pendingLenderRequests = useMemo(
    () => countPendingRequests(lenderRequestsForCurrentUser),
    [lenderRequestsForCurrentUser],
  )

  const dashboardMetrics = useMemo(
    () =>
      buildDashboardMetrics({
        borrowRequests,
        borrowerRequests: borrowerRequestsForCurrentUser,
        lenderRequests: lenderRequestsForCurrentUser,
        currentUser,
        ratingStats,
      }),
    [
      borrowRequests,
      borrowerRequestsForCurrentUser,
      lenderRequestsForCurrentUser,
      currentUser,
      ratingStats,
    ],
  )

  const userItemCounts = useMemo(
    () => calculateUserItemCounts({ borrowRequests, currentUserId: currentUser?.id ?? null }),
    [borrowRequests, currentUser?.id],
  )

  useEffect(() => {
    setCurrentUser((prev: any) => {
      if (!prev) return prev
      if (prev.itemsLent === userItemCounts.lent && prev.itemsBorrowed === userItemCounts.borrowed) {
        return prev
      }
      return { ...prev, itemsLent: userItemCounts.lent, itemsBorrowed: userItemCounts.borrowed }
    })
  }, [userItemCounts])

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

  const recentActivity = useMemo(
    () =>
      buildRecentActivity({
        borrowerRequests: borrowerRequestsForCurrentUser,
        lenderRequests: lenderRequestsForCurrentUser,
        baseActivity: baseRecentActivity,
      }),
    [baseRecentActivity, borrowerRequestsForCurrentUser, lenderRequestsForCurrentUser],
  )

  useEffect(() => {
    if (storedRequestsViewRef.current === null && !autoSelectedRequestsViewRef.current) {
      return
    }
    if (typeof window === "undefined") return
    storedRequestsViewRef.current = requestsView
    window.localStorage.setItem(REQUESTS_VIEW_STORAGE_KEY, requestsView)
  }, [requestsView])

  useEffect(() => {
    if (userMode !== "requests") {
      autoSelectedRequestsViewRef.current = false
      return
    }
    if (storedRequestsViewRef.current) {
      autoSelectedRequestsViewRef.current = true
      return
    }
    if (autoSelectedRequestsViewRef.current) return
    autoSelectedRequestsViewRef.current = true
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
    authHandleLogin(user)
    setShowSignInModal(false)
    setShowRegisterModal(false)
    setUserMode("dashboard")
  }

  const handleLogout = () => {
    authHandleLogout()
    setShowSignInModal(false)
    setShowRegisterModal(false)
    setUserMode("dashboard")
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

  const handleSubmitRequest = async (data: {
    preferredDate: string
    returnDate: string
    meetingPlace: string
    meetingTime: string
    message: string
  }): Promise<boolean> => {
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
      preferred_date: data.preferredDate,
      return_date: data.returnDate,
      meeting_place: data.meetingPlace,
      meeting_time: data.meetingTime,
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
        const meetingDetails = data.meetingPlace ? ` at ${data.meetingPlace}` : ""
        showBanner(
          `Request submitted for ${enriched.itemTitle} on ${enriched.preferredDate} at ${data.meetingTime}${meetingDetails}.`,
          "success",
        )
        setShowRequestModal(false)
        setRequestsView("borrower")

        const emailTarget = enriched.lenderEmail || lenderEmail
        if (emailTarget) {
          void sendLenderEmailNotification({
            email: emailTarget,
            itemTitle: enriched.itemTitle,
            borrowerName: enriched.borrowerName,
            preferredDate: enriched.preferredDate,
            returnDate: enriched.returnDate ?? data.returnDate,
            meetingPlace: enriched.meetingPlace ?? data.meetingPlace,
            meetingTime: enriched.meetingTime ?? data.meetingTime,
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
    const requestIdValue = Number.isFinite(Number(requestId)) ? Number(requestId) : requestId
    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .update({ status: "approved", decision_message: responseMessage ?? null })
        .eq("id", requestIdValue)
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
        void updateItemQuantity(mapped.itemId, -1)
        setScheduleDraftRequest(mapped)
        setShowScheduleModal(true)

        if (mapped.borrowerEmail) {
          void sendBorrowerEmailNotification({
            email: mapped.borrowerEmail,
            itemTitle: mapped.itemTitle,
            borrowerName: mapped.borrowerName,
            lenderName: mapped.lenderName,
            preferredDate: mapped.preferredDate,
            returnDate: mapped.returnDate,
            meetingPlace: mapped.meetingPlace,
            meetingTime: mapped.meetingTime,
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
    const requestIdValue = Number.isFinite(Number(requestId)) ? Number(requestId) : requestId
    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .update({ status: "rejected", decision_message: responseMessage ?? null })
        .eq("id", requestIdValue)
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
            returnDate: mapped.returnDate,
            meetingPlace: mapped.meetingPlace,
            meetingTime: mapped.meetingTime,
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

  const updateBorrowRequestStatus = useCallback(
    async (requestId: string | null | undefined, status: BorrowRequest["status"]) => {
      if (!requestId) {
        return false
      }

      const requestIdValue = Number.isFinite(Number(requestId)) ? Number(requestId) : requestId

      try {
        const { error } = await supabase.from("borrow_requests").update({ status }).eq("id", requestIdValue)

        if (error) {
          console.error(`Failed to update borrow request status to ${status}`, error)
          return false
        }
        return true
      } catch (err) {
        console.error("Unexpected error while updating borrow request status", err)
      }

      return false
    },
    [],
  )

  const handleCompleteRequest = async (requestId: string) => {
    const success = await updateBorrowRequestStatus(requestId, "completed")
    if (!success) {
      showBanner("Failed to mark the request as completed. Please try again.", "error")
      return
    }
    setBorrowRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: "completed" } : req)))
  }

  const handleCreateSchedule = (data: {
    startDate: string
    endDate: string
    meetingPlace: string
    meetingTime: string
  }) => {
    const approvedRequest = scheduleDraftRequest ?? borrowRequests.find((r) => r.status === "approved")
    if (!approvedRequest) {
      showBanner("No approved request found to schedule.", "error")
      return
    }

    const lenderName = approvedRequest.lenderName || currentUser?.name || "Lender"
    const timestamp = Date.now()
    const borrowerCode = `borrower-${slugify(approvedRequest.borrowerName)}-${timestamp}`
    const lenderCode = `lender-${slugify(lenderName)}-${timestamp}`
    const requestIdValue = approvedRequest.id
      ? Number.isFinite(Number(approvedRequest.id))
        ? Number(approvedRequest.id)
        : approvedRequest.id
      : null

    void (async () => {
      try {
        const { data: inserted, error } = await supabase
          .from("borrow_schedules")
          .insert({
            request_id: requestIdValue,
            item_id: approvedRequest.itemId,
            item_title: approvedRequest.itemTitle,
            borrower_id: approvedRequest.borrowerId || null,
            borrower_name: approvedRequest.borrowerName,
            lender_id: approvedRequest.ownerId || currentUser?.id || null,
            lender_name: lenderName,
            start_date: data.startDate,
            end_date: data.endDate,
            meeting_place: data.meetingPlace,
            meeting_time: data.meetingTime,
            status: "awaiting_handoff",
            return_ready: false,
            borrower_qr_code: borrowerCode,
            lender_qr_code: lenderCode,
          })
          .select("*")
          .single()

        if (error) {
          console.error("Failed to create schedule", error)
          showBanner("Failed to create the schedule. Please try again.", "error")
          return
        }

        const mapped = mapBorrowScheduleRecord(inserted)
        setBorrowSchedules((prev) => {
          const next = prev.filter((schedule) => schedule.id !== mapped.id)
          return [...next, mapped]
        })

        if (currentUser?.id) {
          void refreshBorrowSchedules()
        }

        setBorrowRequests((prev) =>
          prev.map((req) =>
            req.id === approvedRequest.id
              ? {
                  ...req,
                  preferredDate: data.startDate,
                  returnDate: data.endDate,
                  meetingPlace: data.meetingPlace,
                  meetingTime: data.meetingTime,
                }
              : req,
          ),
        )

        setShowScheduleModal(false)
        setScheduleDraftRequest(null)
        showBanner(
          `Schedule created for ${approvedRequest.borrowerName} from ${data.startDate} to ${data.endDate} at ${data.meetingTime} in ${data.meetingPlace}.`,
          "success",
        )
      } catch (err) {
        console.error("Unexpected error while creating schedule", err)
        showBanner("An unexpected error occurred while creating the schedule.", "error")
      }
    })()
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
    if (qrType === "lender") {
      void supabase
        .from("borrow_schedules")
        .update({ return_ready: true })
        .eq("id", schedule.id)
        .then(({ error }) => {
          if (error) {
            console.error("Failed to flag schedule as return-ready", error)
          }
        })
    }
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
    const matchedRequest = borrowRequests.find(
      (request) =>
        request.itemId === selectedSchedule.itemId && request.borrowerName === selectedSchedule.borrowerName,
    )
    const resolvedRequestId = selectedSchedule.requestId ?? matchedRequest?.id ?? null

    const syncRequestStatus = (status: BorrowRequest["status"]) => {
      if (!resolvedRequestId) return
      setBorrowRequests((prev) => prev.map((req) => (req.id === resolvedRequestId ? { ...req, status } : req)))
      void updateBorrowRequestStatus(resolvedRequestId, status)
    }

    if (scanType === "handoff") {
      setBorrowSchedules((prev) =>
        prev.map((sched) =>
          sched.id === selectedSchedule.id
            ? { ...sched, status: "borrowed" as const, returnReady: false }
            : sched,
        ),
      )
      void supabase
        .from("borrow_schedules")
        .update({ status: "borrowed", return_ready: false })
        .eq("id", selectedSchedule.id)
        .then(({ error }) => {
          if (error) {
            console.error("Failed to update schedule status to borrowed", error)
          }
        })
      syncRequestStatus("ongoing")
      showBanner(`Handoff confirmed for ${selectedSchedule.itemTitle}. Transaction is now ongoing.`, "success")
    } else {
      setBorrowSchedules((prev) =>
        prev.map((sched) =>
          sched.id === selectedSchedule.id ? { ...sched, status: "completed" as const, returnReady: false } : sched,
        ),
      )
      void updateItemQuantity(scheduleItemId, 1)
      void supabase
        .from("borrow_schedules")
        .update({ status: "completed", return_ready: false })
        .eq("id", selectedSchedule.id)
        .then(({ error }) => {
          if (error) {
            console.error("Failed to mark schedule as completed", error)
          }
        })
      syncRequestStatus("completed")
      showBanner(`Item return confirmed. Transaction completed with ${selectedSchedule.borrowerName}.`, "success")
      openRatingModal({
        requestId: matchedRequest?.id,
        requestIdSource: matchedRequest?.idSource,
        originalKeys: {
          id: matchedRequest?.rawId ?? null,
          uuid: matchedRequest?.rawUuid ?? null,
          request_id: matchedRequest?.rawRequestId ?? null,
        },
        targetUserId: matchedRequest?.borrowerId ?? null,
        targetUserName: selectedSchedule.borrowerName,
        itemTitle: selectedSchedule.itemTitle,
        direction: "lenderToBorrower",
        existingRating: matchedRequest?.lenderFeedbackRating ?? null,
        existingReview: matchedRequest?.lenderFeedbackMessage ?? null,
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
    void supabase
      .from("borrow_schedules")
      .update({ status: "completed", return_ready: false })
      .eq("id", scheduleId)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to mark schedule complete", error)
        }
      })
    const completedSchedule = borrowSchedules.find((s) => s.id === scheduleId)
    if (completedSchedule) {
      void updateItemQuantity(completedSchedule.itemId, 1)
      const matchingRequest = borrowRequests.find(
        (request) =>
          request.itemId === completedSchedule.itemId && request.borrowerName === completedSchedule.borrowerName,
      )
      const resolvedRequestId = completedSchedule.requestId ?? matchingRequest?.id ?? null
      if (resolvedRequestId) {
        setBorrowRequests((prev) =>
          prev.map((req) => (req.id === resolvedRequestId ? { ...req, status: "completed" } : req)),
        )
        void updateBorrowRequestStatus(resolvedRequestId, "completed")
      }
      openRatingModal({
        requestId: matchingRequest?.id,
        requestIdSource: matchingRequest?.idSource,
        originalKeys: {
          id: matchingRequest?.rawId ?? null,
          uuid: matchingRequest?.rawUuid ?? null,
          request_id: matchingRequest?.rawRequestId ?? null,
        },
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
      requestIdSource: request.idSource,
      originalKeys: {
        id: request.rawId ?? null,
        uuid: request.rawUuid ?? null,
        request_id: request.rawRequestId ?? null,
      },
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
              onClick={dismissBanner}
            >
              Dismiss
            </Button>
          </div>
        )}

        {!isAuthenticated ? (
          <LandingPage
            onSignInClick={() => {
              setShowSignInModal(true)
            }}
            onRegisterClick={() => setShowRegisterModal(true)}
          />
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
              <DashboardView
                currentUser={currentUser}
                metricsByRole={dashboardMetrics}
                recentActivity={recentActivity}
                onNavigate={setUserMode}
              />
            ) : userMode === "browse" ? (
              <BrowseView
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterCondition={filterCondition}
                onConditionChange={setFilterCondition}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters((prev) => !prev)}
                itemsError={itemsError}
                deleteItemError={deleteItemError}
                hasPendingDeleteItem={Boolean(pendingDeleteItem)}
                items={filteredAndSortedItems}
                onItemClick={handleItemClick}
                isLoading={itemsLoading}
                currentUserId={currentUser?.id ?? null}
                deletingItemId={deletingItemId}
                onDeleteItem={handleDeleteItemRequest}
                removingItemIds={removingItemIds}
              />
            ) : userMode === "requests" ? (
              <RequestsView
                requestsView={requestsView}
                onRequestsViewChange={setRequestsView}
                borrowerRequests={borrowerRequestsForCurrentUser}
                lenderRequests={lenderRequestsForCurrentUser}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onComplete={handleCompleteRequest}
                onOpenRating={handleOpenRequestRating}
              />
            ) : userMode === "schedule" ? (
              <ScheduleView
                schedules={scheduleCards}
                currentUserName={currentUser?.name ?? ""}
                onGenerateQR={handleGenerateQR}
                onScanQR={handleScanQR}
              />
            ) : userMode === "profile" ? (
              <ProfileView currentUser={currentUser} ratingStats={ratingStats} reviews={receivedReviews} />
            ) : (
              <LendView
                listItemError={listItemError}
                listItemSuccess={listItemSuccess}
                isEditingListing={isEditingListing}
                onCancelEdit={handleCancelEdit}
                onSubmit={handleListItemSubmit}
                listItemForm={listItemForm}
                setListItemForm={setListItemForm}
                imagePreviewUrl={imagePreviewUrl}
                setImagePreviewUrl={setImagePreviewUrl}
                listItemExistingImage={listItemExistingImage}
                isSubmittingItem={isSubmittingItem}
              />
            )}
          </>
        )}
      </main>

      <AuthModals
        signIn={{
          isOpen: showSignInModal,
          onClose: () => setShowSignInModal(false),
          onLogin: handleLogin,
          onSwitchToRegister: () => {
            setShowSignInModal(false)
            setShowRegisterModal(true)
          },
        }}
        register={{
          isOpen: showRegisterModal,
          onClose: () => setShowRegisterModal(false),
          onRegister: handleLogin,
          onSwitchToSignIn: () => {
            setShowRegisterModal(false)
            setShowSignInModal(true)
          },
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
        itemTitle={scheduleModalContext?.itemTitle ?? ""}
        borrowerName={scheduleModalContext?.borrowerName ?? ""}
        onSubmit={handleCreateSchedule}
        defaults={scheduleModalContext?.defaults}
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
