"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Inbox, Calendar, User, Save } from "lucide-react"
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
import { supabase } from "@/lib/supabaseclient"
import type { AuthUser } from "@/types/auth"

interface BorrowRequest {
  id: string
  itemId: string
  itemTitle: string
  itemImage: string | null
  borrowerName: string
  borrowerRating: number
  requestDate: Date
  preferredDate: string
  message: string
  status: "pending" | "approved" | "rejected" | "completed"
  lenderName: string
  lenderEmail: string
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

export default function Home() {
  const [status, setStatus] = useState('Testing connection...');

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('pg_tables').select('*').limit(1);
      if (error) setStatus('Connection failed: ' + error.message);
      else setStatus('Connection successful.');
      console.log(error?.message);
    }
    testConnection();
  }, []);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
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
  const [ratingTarget, setRatingTarget] = useState<{ userName: string; itemTitle: string } | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const [userReviews, setUserReviews] = useState<UserReview[]>([
    {
      id: "rev-1",
      rating: 5,
      review: "Great item, very well maintained!",
      reviewer: "Alex Johnson",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      itemTitle: "Laptop Stand",
    },
    {
      id: "rev-2",
      rating: 4,
      review: "Good condition, fast response",
      reviewer: "Sarah Lee",
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      itemTitle: "Calculus Textbook",
    },
  ])

  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([
    {
      id: "req-1",
      itemId: "1",
      itemTitle: "Laptop Stand",
      itemImage: "/laptop-stand.png",
      borrowerName: "Alex Johnson",
      borrowerRating: 4.6,
      requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      preferredDate: "2025-10-25",
      message: "Need this for my project work",
      status: "pending",
      lenderName: "Juan Dela Cruz",
      lenderEmail: "juan@batstateU.edu",
    },
    {
      id: "req-2",
      itemId: "2",
      itemTitle: "Calculus Textbook",
      itemImage: "/calculus-textbook.png",
      borrowerName: "Sarah Lee",
      borrowerRating: 4.8,
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      preferredDate: "2025-10-20",
      message: "For exam preparation",
      status: "approved",
      lenderName: "Maria Santos",
      lenderEmail: "maria@batstateU.edu",
    },
  ])

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
      },
      availability: record?.availability ?? "Available",
      deposit: Boolean(record?.deposit ?? record?.deposit_required ?? false),
      campus: record?.campus ?? "Main Campus",
      description: record?.description ?? "",
      createdAt: record?.created_at ? new Date(record.created_at) : new Date(),
      quantity: safeNumber(record?.quantity, 1),
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

  const filteredAndSortedItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    const filtered = items.filter((item) => {
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
  }, [filterCondition, items, searchQuery, selectedCategory, sortBy])

  const isEditingListing = Boolean(editingItemId)

  const recentActivity = [
    {
      id: "act-1",
      type: "request" as const,
      title: "New Borrow Request",
      description: "Alex Johnson requested to borrow Laptop Stand",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "Pending",
    },
    {
      id: "act-2",
      type: "approval" as const,
      title: "Request Approved",
      description: "You approved Sarah Lee's request for Calculus Textbook",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "Approved",
    },
    {
      id: "act-3",
      type: "completion" as const,
      title: "Borrowing Completed",
      description: "Laptop Stand was returned by Alex Johnson",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "Completed",
    },
    {
      id: "act-4",
      type: "rating" as const,
      title: "New Rating Received",
      description: "Alex Johnson gave you a 5-star rating",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "5 Stars",
    },
  ]

  const handleLogin = (user: AuthUser) => {
    setCurrentUser({
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      fullName: user.fullName,
      name: user.fullName || user.email,
      email: user.email,
      rating: 5.0,
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

  const handleRequestBorrow = () => {
    if (selectedItem && currentUser && selectedItem.ownerId === currentUser.id) {
      return
    }
    setShowRequestModal(true)
  }

  const handleSubmitRequest = (data: any) => {
    if (!currentUser || !selectedItem) {
      console.error("Attempted to submit a borrow request without an active user or selected item.")
      return
    }

    const newRequest: BorrowRequest = {
      id: `req-${Date.now()}`,
      itemId: selectedItem.id,
      itemTitle: selectedItem.title,
      itemImage: selectedItem.image ?? null,
      borrowerName: currentUser.name,
      borrowerRating: currentUser.rating,
      requestDate: new Date(),
      preferredDate: data.date,
      message: data.message,
      status: "pending",
      lenderName: selectedItem.lender.name,
      lenderEmail: "lender@batstateU.edu",
    }
    setBorrowRequests([...borrowRequests, newRequest])
    alert(`Request submitted for ${selectedItem.title}!\nDate: ${data.date}`)
    setShowRequestModal(false)
  }

  const handleApproveRequest = (requestId: string) => {
    setBorrowRequests(
      borrowRequests.map((req) => (req.id === requestId ? { ...req, status: "approved" as const } : req)),
    )
    setShowScheduleModal(true)
  }

  const handleRejectRequest = (requestId: string) => {
    setBorrowRequests(
      borrowRequests.map((req) => (req.id === requestId ? { ...req, status: "rejected" as const } : req)),
    )
  }

  const handleCompleteRequest = (requestId: string) => {
    setBorrowRequests(
      borrowRequests.map((req) => (req.id === requestId ? { ...req, status: "completed" as const } : req)),
    )
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
      setBorrowSchedules([...borrowSchedules, newSchedule])
      setShowScheduleModal(false)
      alert("Schedule created successfully!")
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

    if (scanType === "handoff") {
      setBorrowSchedules((prev) =>
        prev.map((sched) =>
          sched.id === selectedSchedule.id
            ? { ...sched, status: "borrowed" as const, returnReady: false }
            : sched,
        ),
      )
      alert(
        `✓ Handoff confirmed!\n\nBorrower: ${selectedSchedule.borrowerName}\nItem: ${selectedSchedule.itemTitle}\nStatus updated to Successfully Borrowed.`,
      )
    } else {
      setBorrowSchedules((prev) =>
        prev.map((sched) =>
          sched.id === selectedSchedule.id ? { ...sched, status: "completed" as const, returnReady: false } : sched,
        ),
      )
      alert(`✓ Item return confirmed!\n\nTransaction completed with ${selectedSchedule.borrowerName}`)

      setRatingTarget({
        userName: selectedSchedule.borrowerName,
        itemTitle: selectedSchedule.itemTitle,
      })
      setShowRatingModal(true)
    }

    setShowQRScanner(false)
    setSelectedSchedule(null)
    setScanType(null)
    return true
  }

  const handleMarkScheduleComplete = (scheduleId: string) => {
    setBorrowSchedules(
      borrowSchedules.map((sched) =>
        sched.id === scheduleId ? { ...sched, status: "completed" as const, returnReady: false } : sched,
      ),
    )
    const completedSchedule = borrowSchedules.find((s) => s.id === scheduleId)
    if (completedSchedule) {
      setRatingTarget({
        userName: completedSchedule.borrowerName,
        itemTitle: completedSchedule.itemTitle,
      })
      setShowRatingModal(true)
    }
  }

  const handleSubmitRating = (data: { rating: number; review: string }) => {
    if (ratingTarget) {
      const newReview: UserReview = {
        id: `rev-${Date.now()}`,
        rating: data.rating,
        review: data.review,
        reviewer: ratingTarget.userName,
        date: new Date(),
        itemTitle: ratingTarget.itemTitle,
      }
      setUserReviews([...userReviews, newReview])
      const avgRating = (userReviews.reduce((sum, r) => sum + r.rating, 0) + data.rating) / (userReviews.length + 1)
      setCurrentUser({ ...currentUser, rating: Number.parseFloat(avgRating.toFixed(1)) })
      setShowRatingModal(false)
      alert("Rating submitted successfully!")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setShowSignInModal(true)}
        userMode={userMode}
        onModeChange={setUserMode}
      />

      <main className="container mx-auto px-4 py-8">
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
            {userMode === "dashboard" ? (
              <Dashboard
                currentUser={currentUser}
                pendingRequests={borrowRequests.filter((r) => r.status === "pending").length}
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

                <ItemsGrid
                  items={filteredAndSortedItems}
                  onItemClick={handleItemClick}
                  isLoading={itemsLoading}
                />
              </>
            ) : userMode === "requests" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Inbox size={32} />
                    My Requests
                  </h2>
                </div>
                <RequestsDashboard
                  requests={borrowRequests}
                  currentUserRole="borrower"
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onComplete={handleCompleteRequest}
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
                  rating={currentUser.rating}
                  totalReviews={userReviews.length}
                  itemsLent={currentUser.itemsLent}
                  itemsBorrowed={currentUser.itemsBorrowed}
                  joinDate={currentUser.joinDate}
                  reviews={userReviews}
                  trustScore={currentUser.trustScore}
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

      {selectedItem && (
        <ItemDetailModal
          isOpen={showItemDetail}
          onClose={() => setShowItemDetail(false)}
          item={selectedItem}
          onRequestBorrow={handleRequestBorrow}
          canEdit={Boolean(currentUser && selectedItem.ownerId === currentUser.id)}
          onEdit={() => startEditingItem(selectedItem)}
          canRequestBorrow={!currentUser || selectedItem.ownerId !== currentUser.id}
        />
      )}

      {selectedItem && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          item={selectedItem}
          onSubmit={handleSubmitRequest}
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
        onClose={() => setShowRatingModal(false)}
        userName={ratingTarget?.userName || ""}
        itemTitle={ratingTarget?.itemTitle || ""}
        onSubmit={handleSubmitRating}
      />
    </div>
  )
}
