import { useCallback, useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { supabase } from "@/lib/supabaseclient"
import { createCurrentUserState, mapSupabaseUserToAuthUser } from "@/lib/home-utils"
import type { AuthUser } from "@/types/auth"
import type { CurrentUserState } from "@/types/interfaces"

interface UseAuthSessionResult {
  isAuthenticated: boolean
  currentUser: CurrentUserState | null
  applyAuthenticatedUser: (authUser: AuthUser) => void
  handleLogin: (authUser: AuthUser) => void
  handleLogout: () => void
  sessionLoading: boolean
  setCurrentUser: Dispatch<SetStateAction<CurrentUserState | null>>
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  const applyAuthenticatedUser = useCallback((authUser: AuthUser) => {
    setCurrentUser(createCurrentUserState(authUser))
    setIsAuthenticated(true)
  }, [])

  useEffect(() => {
    let canceled = false

    const hydrateSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Failed to restore Supabase session", error)
          return
        }

        const user = data.session?.user
        if (user) {
          try {
            const authUser = await mapSupabaseUserToAuthUser(user)
            if (!canceled) {
              applyAuthenticatedUser(authUser)
            }
          } catch (resolveError) {
            console.error("Failed to resolve session user", resolveError)
          }
        } else if (!canceled) {
          setIsAuthenticated(false)
          setCurrentUser(null)
        }
      } catch (unexpected) {
        console.error("Unexpected error while restoring session", unexpected)
      } finally {
        if (!canceled) {
          setSessionLoading(false)
        }
      }
    }

    void hydrateSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (canceled) {
        return
      }

      const user = session?.user
      if (user) {
        try {
          const authUser = await mapSupabaseUserToAuthUser(user)
          if (!canceled) {
            applyAuthenticatedUser(authUser)
          }
        } catch (resolveError) {
          console.error("Failed to resolve auth change user", resolveError)
        }
      } else {
        setIsAuthenticated(false)
        setCurrentUser(null)
      }
    })

    return () => {
      canceled = true
      subscription?.subscription.unsubscribe()
    }
  }, [applyAuthenticatedUser])

  const handleLogin = useCallback(
    (authUser: AuthUser) => {
      applyAuthenticatedUser(authUser)
    },
    [applyAuthenticatedUser],
  )

  const handleLogout = useCallback(() => {
    supabase.auth.signOut().catch((err) => console.error("Failed to sign out", err))
    setIsAuthenticated(false)
    setCurrentUser(null)
  }, [])

  return {
    isAuthenticated,
    currentUser,
    applyAuthenticatedUser,
    handleLogin,
    handleLogout,
    sessionLoading,
    setCurrentUser,
  }
}
