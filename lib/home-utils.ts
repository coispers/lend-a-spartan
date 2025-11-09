import { supabase } from "@/lib/supabaseclient"
import type { AuthUser } from "@/types/auth"
import type { CurrentUserState } from "@/types/interfaces"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export const ENABLE_EMAIL_NOTIFICATIONS = true

export const slugify = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-")

export const summarizeSupabaseError = (error: unknown): string | null => {
  if (!error) {
    return null
  }

  if (error instanceof Error) {
    const code = typeof (error as any).code === "string" ? (error as any).code.trim() : ""
    const details = typeof (error as any).details === "string" ? (error as any).details.trim() : ""
    const base = error.message.trim()
    const parts = [code, base, details].filter(Boolean)
    return parts.length > 0 ? parts.join(" · ") : base || null
  }

  if (typeof error === "object") {
    const payload = error as Record<string, unknown>
    const code = typeof payload.code === "string" ? payload.code.trim() : ""
    const message = typeof payload.message === "string" ? payload.message.trim() : ""
    const details = typeof payload.details === "string" ? payload.details.trim() : ""
    const hint = typeof payload.hint === "string" ? payload.hint.trim() : ""
    const parts = [code, message, details, hint].filter(Boolean)
    return parts.length > 0 ? parts.join(" · ") : null
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim()
  }

  return null
}

export const buildFallbackName = (email: string | null | undefined) => {
  if (!email) return "Spartan User"
  const localPart = email.split("@")[0]
  return localPart ? `${localPart} User` : "Spartan User"
}

export const mapSupabaseUserToAuthUser = async (user: SupabaseUser): Promise<AuthUser> => {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, middle_name, last_name")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError && profileError.code !== "PGRST116") {
    throw new Error(profileError.message)
  }

  const metadata = user.user_metadata ?? {}

  const metadataFirst = typeof metadata.first_name === "string" ? metadata.first_name.trim() : undefined
  const metadataMiddle = typeof metadata.middle_name === "string" ? metadata.middle_name.trim() : undefined
  const metadataLast = typeof metadata.last_name === "string" ? metadata.last_name.trim() : undefined
  const metadataFull = typeof metadata.full_name === "string" ? metadata.full_name.trim() : undefined

  const profileFirst = profileData?.first_name?.trim() || undefined
  const profileMiddle = profileData?.middle_name?.trim() || undefined
  const profileLast = profileData?.last_name?.trim() || undefined

  const defaultHandle = buildFallbackName(user.email)

  const profileFull = [profileFirst, profileMiddle, profileLast].filter(Boolean).join(" ")
  const resolvedFullFromProfile = metadataFull || (profileFull.length > 0 ? profileFull : undefined)

  let resolvedFirst = profileFirst || metadataFirst
  let resolvedMiddle = profileMiddle || metadataMiddle
  let resolvedLast = profileLast || metadataLast

  if ((!resolvedFirst || !resolvedLast) && resolvedFullFromProfile) {
    const nameParts = resolvedFullFromProfile.split(" ").filter(Boolean)
    if (!resolvedFirst && nameParts.length > 0) resolvedFirst = nameParts[0]
    if (!resolvedLast && nameParts.length > 1) resolvedLast = nameParts[nameParts.length - 1]
    if (!resolvedMiddle && nameParts.length > 2) {
      resolvedMiddle = nameParts.slice(1, nameParts.length - 1).join(" ")
    }
  }

  if (!resolvedFirst) {
    const fallbackParts = defaultHandle.split(" ")
    resolvedFirst = fallbackParts[0] || defaultHandle
  }

  if (!resolvedLast) {
    resolvedLast = "User"
  }

  const fullName =
    resolvedFullFromProfile || [resolvedFirst, resolvedMiddle, resolvedLast].filter(Boolean).join(" ")

  return {
    id: user.id,
    email: user.email ?? "",
    firstName: resolvedFirst,
    middleName: resolvedMiddle ?? null,
    lastName: resolvedLast,
    fullName,
    createdAt: user.created_at ?? null,
  }
}

export const createCurrentUserState = (authUser: AuthUser): CurrentUserState => ({
  id: authUser.id,
  firstName: authUser.firstName,
  middleName: authUser.middleName ?? null,
  lastName: authUser.lastName,
  fullName: authUser.fullName,
  name: authUser.fullName || authUser.email,
  email: authUser.email,
  rating: 0,
  itemsLent: 0,
  itemsBorrowed: 0,
  joinDate: authUser.createdAt ? new Date(authUser.createdAt) : new Date(),
})
