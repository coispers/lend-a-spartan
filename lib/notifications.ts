import { ENABLE_EMAIL_NOTIFICATIONS } from "@/lib/home-utils"
import { supabase } from "@/lib/supabaseclient"

export const sendLenderEmailNotification = async (payload: {
  email: string
  itemTitle: string
  borrowerName: string
  preferredDate: string
  returnDate?: string | null
  meetingPlace?: string | null
  meetingTime?: string | null
  message: string
}) => {
  if (!ENABLE_EMAIL_NOTIFICATIONS) {
    return
  }
  try {
    const { error } = await supabase.functions.invoke("send-lender-notification", {
      body: payload,
    })
    if (error) {
      console.error("Failed to send lender email notification", error)
    }
  } catch (error) {
    console.error("Failed to send lender email notification", error)
  }
}

export const sendBorrowerEmailNotification = async (payload: {
  email: string
  itemTitle: string
  borrowerName: string
  lenderName: string
  preferredDate: string
  returnDate?: string | null
  meetingPlace?: string | null
  meetingTime?: string | null
  decisionMessage?: string | null
  notificationType: "approval" | "rejection"
}) => {
  if (!ENABLE_EMAIL_NOTIFICATIONS) {
    return
  }
  try {
    const { error } = await supabase.functions.invoke("send-lender-notification", {
      body: {
        email: payload.email,
        itemTitle: payload.itemTitle,
        borrowerName: payload.borrowerName,
        lenderName: payload.lenderName,
        preferredDate: payload.preferredDate,
        returnDate: payload.returnDate ?? null,
        meetingPlace: payload.meetingPlace ?? null,
        meetingTime: payload.meetingTime ?? null,
        decisionMessage: payload.decisionMessage ?? "",
        notificationType: payload.notificationType,
      },
    })
    if (error) {
      console.error("Failed to send borrower email notification", error)
    }
  } catch (error) {
    console.error("Failed to send borrower email notification", error)
  }
}
