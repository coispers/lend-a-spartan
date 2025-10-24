"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Eye, EyeOff } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, name: string) => void
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const isPasswordValid = (pwd: string) => {
    return /^[a-zA-Z0-9]{8,}$/.test(pwd)
  }

  const isEmailValid = (emailStr: string) => {
    return emailStr.endsWith("@g.batstate-u.edu.ph")
  }

  const emailExists = (emailStr: string) => {
    // In production, this would check against a database
    // For now, we'll assume all emails are available except admin
    return emailStr === "admin@g.batstate-u.edu.ph"
  }

  const handleLogin = async () => {
    setError("")
    setLoading(true)

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (!isEmailValid(email)) {
      setError("Please use your BatStateU email (@g.batstate-u.edu.ph)")
      setLoading(false)
      return
    }

    if (!isPasswordValid(password)) {
      setError("Password must be at least 8 alphanumeric characters")
      setLoading(false)
      return
    }

    if (email === "admin@g.batstate-u.edu.ph" && password === "admin123") {
      onLogin(email, "Admin")
      setEmail("")
      setPassword("")
      setLoading(false)
      return
    }

    if (!emailExists(email)) {
      setError("Email not found. Please register first or check your email.")
      setLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      setError("Invalid email or password")
      setLoading(false)
    }, 500)
  }

  const handleRegister = async () => {
    setError("")
    setLoading(true)

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (!isEmailValid(email)) {
      setError("Please use your BatStateU email (@g.batstate-u.edu.ph)")
      setLoading(false)
      return
    }

    if (!isPasswordValid(password)) {
      setError("Password must be at least 8 alphanumeric characters (letters and numbers only)")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (fullName.length < 2) {
      setError("Please enter a valid name")
      setLoading(false)
      return
    }

    if (emailExists(email)) {
      setError("This email is already registered")
      setLoading(false)
      return
    }

    // Simulate API call and registration
    setTimeout(() => {
      // In production, this would create a new user in the database
      onLogin(email, fullName)
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setFullName("")
      setMode("login")
      setLoading(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "login") {
        handleLogin()
      } else {
        handleRegister()
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-foreground">{mode === "login" ? "Sign In" : "Create Account"}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "login" ? "Welcome to Lend-A-Spartan" : "Join the Lend-A-Spartan community"}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="border border-border"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">BatStateU Email</label>
            <Input
              type="email"
              placeholder="your.name@g.batstate-u.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="border border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">Must end with @g.batstate-u.edu.ph</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="border border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "register" ? "At least 8 alphanumeric characters" : ""}
            </p>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="border border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setError("")
              setEmail("")
              setPassword("")
              setConfirmPassword("")
              setFullName("")
            }}
            disabled={loading}
            className="w-full"
          >
            {mode === "login" ? "Create Account" : "Sign In"}
          </Button>

          {mode === "login" && (
            <p className="text-xs text-center text-muted-foreground mt-4">Demo: admin@g.batstate-u.edu.ph / admin123</p>
          )}
        </div>
      </Card>
    </div>
  )
}
