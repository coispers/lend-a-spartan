"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Inbox, Calendar, User } from "lucide-react"
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
  itemId: number
  itemTitle: string
  itemImage: string
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
  itemId: number
  itemTitle: string
  borrowerName: string
  borrowerQRCode: string
  startDate: string
  endDate: string
  status: "scheduled" | "active" | "item_given" | "overdue" | "completed"
  qrCode: string
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
  const [selectedItem, setSelectedItem] = useState<any>(null)
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
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedQRSchedule, setSelectedQRSchedule] = useState<BorrowSchedule | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanType, setScanType] = useState<"handoff" | "return" | null>(null)
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
      itemId: 1,
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
      itemId: 2,
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

  const [borrowSchedules, setBorrowSchedules] = useState<BorrowSchedule[]>([
    {
      id: "sched-1",
      itemId: 1,
      itemTitle: "Laptop Stand",
      borrowerName: "Alex Johnson",
      borrowerQRCode: `borrower-alex-${Date.now()}`,
      startDate: "2025-10-20",
      endDate: "2025-10-27",
      status: "active",
      qrCode: `item-1-${Date.now()}`,
    },
    {
      id: "sched-2",
      itemId: 2,
      itemTitle: "Calculus Textbook",
      borrowerName: "Sarah Lee",
      borrowerQRCode: `borrower-sarah-${Date.now()}`,
      startDate: "2025-10-15",
      endDate: "2025-10-22",
      status: "scheduled",
      qrCode: `item-2-${Date.now()}`,
    },
  ])

  const mockItems = [
    {
      id: 1,
      title: "Laptop Stand",
      category: "Electronics",
      condition: "Like New",
      image: "/laptop-stand.png",
      lender: { name: "Juan Dela Cruz", rating: 4.8, reviews: 12 },
      availability: "Available",
      deposit: false,
      campus: "Main Campus",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      title: "Calculus Textbook",
      category: "Books",
      condition: "Good",
      image: "/calculus-textbook.png",
      lender: { name: "Maria Santos", rating: 4.9, reviews: 8 },
      availability: "Available",
      deposit: false,
      campus: "Main Campus",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      title: "Lab Goggles",
      category: "Laboratory",
      condition: "Good",
      image: "/lab-goggles.jpg",
      lender: { name: "Pedro Reyes", rating: 4.5, reviews: 5 },
      availability: "Available",
      deposit: true,
      campus: "Science Building",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 4,
      title: "Wireless Mouse",
      category: "Electronics",
      condition: "Like New",
      image: "/wireless-mouse.png",
      lender: { name: "Ana Garcia", rating: 5.0, reviews: 15 },
      availability: "Available",
      deposit: false,
      campus: "Main Campus",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 5,
      title: "USB-C Cable",
      category: "Electronics",
      condition: "Like New",
      image: "/usb-c-cable.jpg",
      lender: { name: "Carlos Mendez", rating: 4.6, reviews: 9 },
      availability: "Available",
      deposit: false,
      campus: "Main Campus",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 6,
      title: "Physics Textbook",
      category: "Books",
      condition: "Fair",
      image: "/physics-textbook.png",
      lender: { name: "Rosa Flores", rating: 4.3, reviews: 6 },
      availability: "Available",
      deposit: false,
      campus: "Science Building",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 7,
      title: "Basketball",
      category: "Sports",
      condition: "Good",
      image: "/basketball-action.png",
      lender: { name: "Miguel Santos", rating: 4.7, reviews: 11 },
      availability: "Available",
      deposit: true,
      campus: "Sports Complex",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: 8,
      title: "Notebook Set",
      category: "School Supplies",
      condition: "Like New",
      image: "/notebook-set.png",
      lender: { name: "Sofia Reyes", rating: 4.9, reviews: 13 },
      availability: "Available",
      deposit: false,
      campus: "Main Campus",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]

  const filteredAndSortedItems = mockItems
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase()
      const matchesCondition =
        filterCondition === "all" || item.condition.toLowerCase() === filterCondition.toLowerCase()
      return matchesSearch && matchesCategory && matchesCondition
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "rating") {
        return b.lender.rating - a.lender.rating
      } else if (sortBy === "name") {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

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

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setShowItemDetail(true)
  }

  const handleRequestBorrow = () => {
    setShowRequestModal(true)
  }

  const handleSubmitRequest = (data: any) => {
    const newRequest: BorrowRequest = {
      id: `req-${Date.now()}`,
      itemId: selectedItem.id,
      itemTitle: selectedItem.title,
      itemImage: selectedItem.image,
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
      const newSchedule: BorrowSchedule = {
        id: `sched-${Date.now()}`,
        itemId: approvedRequest.itemId,
        itemTitle: approvedRequest.itemTitle,
        borrowerName: approvedRequest.borrowerName,
        borrowerQRCode: `borrower-${approvedRequest.borrowerName.replace(/\s+/g, "-")}-${Date.now()}`,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "scheduled",
        qrCode: `item-${approvedRequest.itemId}-${Date.now()}`,
      }
      setBorrowSchedules([...borrowSchedules, newSchedule])
      setShowScheduleModal(false)
      alert("Schedule created successfully!")
    }
  }

  const handleGenerateQR = (schedule: BorrowSchedule) => {
    setSelectedQRSchedule(schedule)
    setShowQRCode(true)
  }

  const handleScanQR = (schedule: BorrowSchedule, type: "handoff" | "return") => {
    setSelectedSchedule(schedule)
    setScanType(type)
    setShowQRScanner(true)
  }

  const handleQRScanComplete = (scannedData: string) => {
    if (!selectedSchedule || !scanType) return

    if (scanType === "handoff") {
      // First scan: Item handoff - change status to item_given
      setBorrowSchedules(
        borrowSchedules.map((sched) =>
          sched.id === selectedSchedule.id ? { ...sched, status: "item_given" as const } : sched,
        ),
      )
      alert(
        `✓ Item handoff confirmed!\n\nBorrower: ${selectedSchedule.borrowerName}\nItem: ${selectedSchedule.itemTitle}`,
      )
    } else if (scanType === "return") {
      // Second scan: Item return - change status to completed and trigger rating
      setBorrowSchedules(
        borrowSchedules.map((sched) =>
          sched.id === selectedSchedule.id ? { ...sched, status: "completed" as const } : sched,
        ),
      )
      alert(`✓ Item return confirmed!\n\nTransaction completed with ${selectedSchedule.borrowerName}`)

      // Trigger rating modal
      setRatingTarget({
        userName: selectedSchedule.borrowerName,
        itemTitle: selectedSchedule.itemTitle,
      })
      setShowRatingModal(true)
    }

    setShowQRScanner(false)
    setSelectedSchedule(null)
    setScanType(null)
  }

  const handleMarkScheduleComplete = (scheduleId: string) => {
    setBorrowSchedules(
      borrowSchedules.map((sched) => (sched.id === scheduleId ? { ...sched, status: "completed" as const } : sched)),
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
                  borrowSchedules.filter((s) => s.status === "active" || s.status === "item_given").length
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

                <ItemsGrid items={filteredAndSortedItems} onItemClick={handleItemClick} />
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
                  onGenerateQR={handleGenerateQR}
                  onScanQR={handleScanQR}
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
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Item Title</label>
                      <Input placeholder="e.g., Laptop Stand" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                        <option>Electronics</option>
                        <option>School Supplies</option>
                        <option>Laboratory</option>
                        <option>Books</option>
                        <option>Sports</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        rows={4}
                        placeholder="Describe the item condition and details..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Quantity</label>
                        <Input type="number" placeholder="1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Condition</label>
                        <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                          <option>Like New</option>
                          <option>Good</option>
                          <option>Fair</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="deposit" className="rounded" />
                      <label htmlFor="deposit" className="text-sm">
                        Require deposit for this item
                      </label>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus size={20} className="mr-2" />
                      List Item
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

      {showQRCode && selectedQRSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <QRCodeGenerator
              data={selectedQRSchedule.qrCode}
              title={`QR Code - ${selectedQRSchedule.itemTitle}`}
              onClose={() => setShowQRCode(false)}
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
          }}
          title={scanType === "handoff" ? "Give Item to Borrower" : "Receive Item from Borrower"}
          description={
            scanType === "handoff"
              ? `Scan ${selectedSchedule.borrowerName}'s QR code to confirm item handoff`
              : `Scan ${selectedSchedule.borrowerName}'s QR code to confirm item return`
          }
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
