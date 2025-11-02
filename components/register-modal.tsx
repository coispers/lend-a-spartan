"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabaseclient"
import type { AuthUser } from "@/types/auth"

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onRegister: (user: AuthUser) => Promise<void> | void
  onSwitchToSignIn: () => void
}

export default function RegisterModal({ isOpen, onClose, onRegister, onSwitchToSignIn }: RegisterModalProps) {
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setFirstName("")
      setMiddleName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
      setError("")
      setSuccessMessage("")
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isPasswordValid = (pwd: string) => {
    return /^[a-zA-Z0-9]{8,}$/.test(pwd)
  }

  const isEmailValid = (emailStr: string) => {
    return emailStr.endsWith("@g.batstate-u.edu.ph")
  }

  const handleRegister = async () => {
    setError("")
    setSuccessMessage("")
    setLoading(true)

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields")
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

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Please enter a valid first and last name")
      setLoading(false)
      return
    }

    const trimmedFirstName = firstName.trim()
    const trimmedMiddleName = middleName.trim()
    const trimmedLastName = lastName.trim()
  const fullName = [trimmedFirstName, trimmedMiddleName, trimmedLastName].filter(Boolean).join(" ")

    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: trimmedFirstName,
          middle_name: trimmedMiddleName || null,
          last_name: trimmedLastName,
          full_name: fullName,
        },
        emailRedirectTo: redirectUrl,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("Registration failed. Please try again.")
      setLoading(false)
      return
    }

    if ((data.user.identities?.length ?? 0) === 0) {
      setError("This email is already registered. Please sign in instead.")
      setLoading(false)
      return
    }

    if (data.session && data.user) {
      const profilePayload = {
        id: data.user.id,
        email: data.user.email ?? email,
        first_name: trimmedFirstName,
        middle_name: trimmedMiddleName || null,
        last_name: trimmedLastName,
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" })

      let finalProfileError = profileError

      if (profileError?.code === "42703") {
        const { error: fallbackError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: profilePayload.id,
              email: profilePayload.email,
            },
            { onConflict: "id" }
          )

        finalProfileError = fallbackError
      }

      if (finalProfileError) {
        setError(`Account created but profile could not be saved: ${finalProfileError.message}`)
        setLoading(false)
        return
      }

      await onRegister({
        id: data.user.id,
        email: data.user.email ?? email,
        firstName: trimmedFirstName,
        middleName: trimmedMiddleName || null,
        lastName: trimmedLastName,
        fullName,
        createdAt: data.user.created_at,
      })

      setFirstName("")
      setMiddleName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } else {
      setSuccessMessage("Registration successful! Please check your email to confirm your account before signing in.")
    }

    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister()
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

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Join Us</h2>
          <p className="text-sm text-muted-foreground mt-2">Create your Lend-A-Spartan account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <Input
              type="text"
              placeholder="Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Middle Name (optional)</label>
            <Input
              type="text"
              placeholder=""
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <Input
              type="text"
              placeholder="Dela Cruz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">BatStateU Email</label>
            <Input
              type="email"
              placeholder="sr-code@g.batstate-u.edu.ph"
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
            <p className="text-xs text-muted-foreground mt-1">At least 8 alphanumeric characters</p>
          </div>

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

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 font-medium"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={onSwitchToSignIn} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
