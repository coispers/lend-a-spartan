import { useCallback, useEffect, useState } from "react"

type BannerType = "success" | "error" | "info"

export interface DashboardBannerState {
  message: string
  type: BannerType
}

export const useDashboardBanner = () => {
  const [uiBanner, setUiBanner] = useState<DashboardBannerState | null>(null)

  const showBanner = useCallback((message: string, type: BannerType = "info") => {
    setUiBanner({ message, type })
  }, [])

  const dismissBanner = useCallback(() => {
    setUiBanner(null)
  }, [])

  useEffect(() => {
    if (!uiBanner) return
    const timeout = window.setTimeout(() => {
      setUiBanner(null)
    }, 5000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [uiBanner])

  return {
    uiBanner,
    showBanner,
    dismissBanner,
  }
}
