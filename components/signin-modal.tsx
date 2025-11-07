"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabaseclient"
import type { AuthUser } from "@/types/auth"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (user: AuthUser) => Promise<void> | void
  onSwitchToRegister: () => void
}

export default function SignInModal({ isOpen, onClose, onLogin, onSwitchToRegister }: SignInModalProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setEmail("")
      setPassword("")
      setShowPassword(false)
      setError("")
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

  const handleLogin = async () => {
    try {
      setError("")
      setLoading(true)

      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }

      if (!isEmailValid(email)) {
        setError("Please use your BatStateU email (@g.batstate-u.edu.ph)")
        return
      }

      if (!isPasswordValid(password)) {
        setError("Password must be at least 8 alphanumeric characters")
        return
      }

      const token = recaptchaRef.current?.getValue()
      if (!token) {
        throw new Error("Please complete the CAPTCHA verification")
      }
      recaptchaRef.current?.reset()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      if (!data.user) {
        throw new Error("Login failed. Please try again.")
      }

      const user = data.user

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError && profileError.code !== "PGRST116") {
        throw new Error(`Unable to load your profile: ${profileError.message}`)
      }

      const metadata = user.user_metadata ?? {}

      const metadataFirst = typeof metadata.first_name === "string" ? metadata.first_name.trim() : undefined
      const metadataMiddle = typeof metadata.middle_name === "string" ? metadata.middle_name.trim() : undefined
      const metadataLast = typeof metadata.last_name === "string" ? metadata.last_name.trim() : undefined
      const metadataFull = typeof metadata.full_name === "string" ? metadata.full_name.trim() : undefined

      const profileFirst = profileData?.first_name?.trim()
      const profileMiddle = profileData?.middle_name?.trim() ?? undefined
      const profileLast = profileData?.last_name?.trim()

      const defaultHandle = user.email?.split("@")[0] ?? "Spartan"

      const profileFullFromParts = [profileFirst, profileMiddle, profileLast].filter(Boolean).join(" ")
      const derivedFullFromProfile = metadataFull || (profileFullFromParts.length > 0 ? profileFullFromParts : undefined)

      let derivedFirst = profileFirst || metadataFirst
      let derivedMiddle = profileMiddle || metadataMiddle
      let derivedLast = profileLast || metadataLast

      if ((!derivedFirst || !derivedLast) && derivedFullFromProfile) {
        const nameParts = derivedFullFromProfile.split(" ").filter(Boolean)
        if (!derivedFirst && nameParts.length > 0) derivedFirst = nameParts[0]
        if (!derivedLast && nameParts.length > 1) derivedLast = nameParts[nameParts.length - 1]
        if (!derivedMiddle && nameParts.length > 2)
          derivedMiddle = nameParts.slice(1, nameParts.length - 1).join(" ")
      }

      if (!derivedFirst) derivedFirst = defaultHandle
      if (!derivedLast) derivedLast = "User"

      const resolvedFullName =
        derivedFullFromProfile || [derivedFirst, derivedMiddle, derivedLast].filter(Boolean).join(" ")

      await onLogin({
        id: user.id,
        email: user.email ?? email,
        firstName: derivedFirst,
        middleName: derivedMiddle || null,
        lastName: derivedLast,
        fullName: resolvedFullName,
        createdAt: user.created_at,
      })

      setEmail("")
      setPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
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
          <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your Lend-A-Spartan account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
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
          </div>

          <div className="flex justify-center mb-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              size="normal"
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 font-medium"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Still don't have an account?{" "}
              <button onClick={onSwitchToRegister} className="text-primary hover:underline font-medium">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
