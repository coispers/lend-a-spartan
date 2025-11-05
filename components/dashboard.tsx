"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Clock, CheckCircle, Star } from "lucide-react"

type DashboardRole = "combined" | "lender" | "borrower"

interface DashboardMetrics {
  pendingRequests: number
  activeBorrowings: number
  completedTransactions: number
  rating: number | null
  totalReviews: number
}

interface DashboardProps {
  currentUser: any
  metricsByRole: Record<DashboardRole, DashboardMetrics>
  recentActivity: Array<{
    id: string
    type: "request" | "approval" | "completion" | "rating"
    title: string
    description: string
    date: Date
    status?: string
  }>
  onNavigate: (mode: "dashboard" | "browse" | "lend" | "requests" | "schedule" | "profile") => void
}

export default function Dashboard({
  currentUser,
  metricsByRole,
  recentActivity,
  onNavigate,
}: DashboardProps) {
  const [roleFilter, setRoleFilter] = useState<DashboardRole>("combined")

  const roleLabels: Record<DashboardRole, string> = {
    combined: "All Roles",
    lender: "As Lender",
    borrower: "As Borrower",
  }

  const metrics = metricsByRole[roleFilter] ?? metricsByRole.combined
  const ratingValue =
    metrics.totalReviews > 0 && metrics.rating !== null
      ? metrics.rating.toFixed(2)
      : metrics.totalReviews > 0
        ? "0.00"
        : "—"
  const ratingStarClass =
    metrics.totalReviews > 0 && metrics.rating !== null
      ? "fill-accent text-accent"
      : "text-muted-foreground"

  const displayFirstName =
    currentUser?.firstName ||
    (typeof currentUser?.name === "string" ? currentUser.name.split(" ")[0] : "Spartan")

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "request":
        return <Clock size={18} className="text-primary" />
      case "approval":
        return <CheckCircle size={18} className="text-primary" />
      case "completion":
        return <CheckCircle size={18} className="text-primary" />
      case "rating":
        return <Star size={18} className="text-accent" />
      default:
        return <Clock size={18} className="text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-8 md:space-y-12">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
          Welcome back, {displayFirstName}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">Here's your activity overview</p>
      </div>

      <Tabs value={roleFilter} onValueChange={(value) => setRoleFilter(value as DashboardRole)}>
        <TabsList className="grid w-full grid-cols-3 md:inline-flex md:w-auto md:gap-2 md:h-10">
          <TabsTrigger value="combined" className="text-xs md:text-sm py-2">
            All Roles
          </TabsTrigger>
          <TabsTrigger value="lender" className="text-xs md:text-sm py-2">
            As Lender
          </TabsTrigger>
          <TabsTrigger value="borrower" className="text-xs md:text-sm py-2">
            As Borrower
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-3 md:p-6 border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                Pending Requests · {roleLabels[roleFilter]}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{metrics.pendingRequests}</p>
            </div>
            <Clock size={16} className="md:w-5 md:h-5 text-primary flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3 md:p-6 border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                Active Borrowings · {roleLabels[roleFilter]}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{metrics.activeBorrowings}</p>
            </div>
            <TrendingUp size={16} className="md:w-5 md:h-5 text-primary flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3 md:p-6 border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                Completed · {roleLabels[roleFilter]}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{metrics.completedTransactions}</p>
            </div>
            <CheckCircle size={16} className="md:w-5 md:h-5 text-primary flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3 md:p-6 border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                Your Rating · {roleLabels[roleFilter]}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{ratingValue}</p>
                <Star size={14} className={`md:w-4 md:h-4 flex-shrink-0 ${ratingStarClass}`} />
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                {metrics.totalReviews} review{metrics.totalReviews === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Button
            onClick={() => onNavigate("browse")}
            className="h-12 md:h-auto md:py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
          >
            Browse Items
          </Button>
          <Button
            onClick={() => onNavigate("lend")}
            variant="outline"
            className="h-12 md:h-auto md:py-6 border-2 border-border hover:border-primary font-medium text-base"
          >
            List an Item
          </Button>
          <Button
            onClick={() => onNavigate("requests")}
            variant="outline"
            className="h-12 md:h-auto md:py-6 border-2 border-border hover:border-primary font-medium text-base"
          >
            Manage Requests
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Recent Activity</h2>
        <div className="space-y-2 md:space-y-3">
          {recentActivity.length === 0 ? (
            <Card className="p-6 md:p-8 text-center border border-border">
              <p className="text-muted-foreground">No recent activity</p>
            </Card>
          ) : (
            recentActivity.map((activity) => (
              <Card
                key={activity.id}
                className="p-3 md:p-4 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="mt-0.5 flex-shrink-0">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-foreground text-sm md:text-base">{activity.title}</h3>
                      {activity.status && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
