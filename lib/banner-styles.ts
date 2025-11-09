import { CheckCircle2, AlertTriangle, Info } from "lucide-react"

export const bannerStyles = {
  success: {
    border: "border-emerald-500/50",
    background: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-100",
    button: "text-emerald-700 hover:text-emerald-900 dark:text-emerald-100 dark:hover:text-emerald-50",
  },
  error: {
    border: "border-red-500/50",
    background: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-100",
    button: "text-red-700 hover:text-red-900 dark:text-red-100 dark:hover:text-red-50",
  },
  info: {
    border: "border-primary/40",
    background: "bg-primary/5",
    text: "text-primary",
    button: "text-primary hover:text-primary/80",
  },
} as const

export const bannerIconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

export type BannerType = keyof typeof bannerStyles
