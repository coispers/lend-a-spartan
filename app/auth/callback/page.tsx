"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseclient"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Confirming your email...")
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const handleAuthCallback = async () => {
      const hashFragment = window.location.hash

      if (!hashFragment) {
        if (isMounted) {
          setStatus("Missing confirmation details. Please try the link again or contact support.")
        }
        return
      }

      const params = new URLSearchParams(hashFragment.slice(1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (!accessToken || !refreshToken) {
        if (isMounted) {
          setStatus("Invalid confirmation response. Please try the link again or register once more.")
        }
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        if (isMounted) {
          setStatus(`Unable to finalize confirmation: ${sessionError.message}`)
        }
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        if (isMounted) {
          setStatus("We could not retrieve your account details. Please try signing up again.")
        }
        return
      }

      const user = userData.user
      const metadata = user.user_metadata ?? {}

      const metadataFirst = typeof metadata.first_name === "string" ? metadata.first_name.trim() : ""
      const metadataMiddle = typeof metadata.middle_name === "string" ? metadata.middle_name.trim() : ""
      const metadataLast = typeof metadata.last_name === "string" ? metadata.last_name.trim() : ""
      const metadataFull = typeof metadata.full_name === "string" ? metadata.full_name.trim() : ""

  const computedFullName = [metadataFirst, metadataMiddle, metadataLast].filter(Boolean).join(" ")
  const emailHandle = (user.email ?? "").split("@")[0]
  const fullName = metadataFull || computedFullName || emailHandle

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email,
            first_name: metadataFirst || null,
            middle_name: metadataMiddle || null,
            last_name: metadataLast || null,
          },
          { onConflict: "id" }
        )

      let finalProfileError = profileError

      if (profileError?.code === "42703") {
        const { error: fallbackError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
            },
            { onConflict: "id" }
          )

        finalProfileError = fallbackError
      }

      if (finalProfileError) {
        if (isMounted) {
          setStatus(`Email confirmed, but we could not save your profile: ${finalProfileError.message}`)
        }
        return
      }

      window.history.replaceState(null, "", window.location.pathname)

      if (isMounted) {
        setStatus("Email confirmed! You can now sign in with your new account.")
      }

      await supabase.auth.signOut()

      setTimeout(() => {
        if (isMounted) {
          router.replace("/")
        }
      }, 2000)
    }

    void handleAuthCallback()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Account Confirmation</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
