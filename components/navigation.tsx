"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, Menu, X } from "lucide-react"

interface NavigationProps {
  isAuthenticated: boolean
  currentUser: any
  onLogout: () => void
  onLoginClick: () => void
  userMode: "dashboard" | "browse" | "lend" | "requests" | "schedule" | "profile"
  onModeChange: (mode: "dashboard" | "browse" | "lend" | "requests" | "schedule" | "profile") => void
  pendingLenderRequests?: number
}

export default function Navigation({
  isAuthenticated,
  currentUser,
  onLogout,
  onLoginClick,
  userMode,
  onModeChange,
  pendingLenderRequests = 0,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", mode: "dashboard" as const },
    { label: "Browse", mode: "browse" as const },
    { label: "Requests", mode: "requests" as const },
    { label: "Schedule", mode: "schedule" as const },
    { label: "Profile", mode: "profile" as const },
  ]

  const handleNavClick = (mode: typeof userMode) => {
    onModeChange(mode)
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* Desktop and Mobile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => handleNavClick("dashboard")}>
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground text-sm">
              LS
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Lend-A-Spartan</h1>
          </div>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              <div className="flex gap-1">
                {navItems.map((item) => (
                  <Button
                    key={item.mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavClick(item.mode)}
                    className={`text-sm ${
                      userMode === item.mode
                        ? "text-primary font-semibold border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {item.label}
                      {item.mode === "requests" && pendingLenderRequests > 0 && (
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                          {pendingLenderRequests}
                        </span>
                      )}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-4 pl-6 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.rating} ⭐</p>
                </div>
                <Button
                  onClick={() => handleNavClick("lend")}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus size={16} className="mr-1" />
                  List Item
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut size={18} />
                </Button>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <Button
              onClick={onLoginClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm md:text-base"
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-border pt-4">
            {navItems.map((item) => (
              <Button
                key={item.mode}
                variant="ghost"
                className={`w-full justify-start text-base h-10 ${
                  userMode === item.mode
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => handleNavClick(item.mode)}
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.mode === "requests" && pendingLenderRequests > 0 && (
                    <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                      {pendingLenderRequests}
                    </span>
                  )}
                </span>
              </Button>
            ))}

            <div className="pt-2 border-t border-border mt-2 space-y-2">
              <Button
                onClick={() => handleNavClick("lend")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10"
              >
                <Plus size={16} className="mr-2" />
                List Item
              </Button>
              <Button variant="outline" onClick={onLogout} className="w-full h-10 bg-transparent">
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="pt-2 border-t border-border mt-2">
              <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.rating} ⭐</p>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
