import { slugify } from "@/lib/home-utils"
import type { BorrowRequest, BorrowSchedule, MarketplaceItem } from "@/types/interfaces"

export const mapBorrowScheduleRecord = (record: any): BorrowSchedule => {
  const safeString = (value: any, fallback = "") => {
    if (value === null || value === undefined) return fallback
    return String(value)
  }

  const safeOptionalString = (value: any) => {
    if (value === null || value === undefined) return null
    return String(value)
  }

  const normalizeDate = (value: any) => {
    const raw = safeString(value, "")
    if (!raw) return ""
    return raw.length > 10 ? raw.slice(0, 10) : raw
  }

  const normalizeTime = (value: any) => {
    const raw = safeOptionalString(value)
    if (!raw) return null
    return raw.length > 5 ? raw.slice(0, 5) : raw
  }

  const id = safeString(record?.id ?? record?.uuid ?? `sched-${Date.now()}`)
  const borrowerName = safeString(record?.borrower_name ?? record?.borrowerName ?? "Borrower")
  const lenderName = safeString(record?.lender_name ?? record?.lenderName ?? "Lender")

  const borrowerCode =
    safeOptionalString(record?.borrower_qr_code ?? record?.borrowerQRCode ?? null) ??
    `borrower-${slugify(borrowerName)}-${id}`
  const lenderCode =
    safeOptionalString(record?.lender_qr_code ?? record?.lenderQRCode ?? null) ??
    `lender-${slugify(lenderName)}-${id}`

  return {
    id,
    requestId: safeOptionalString(record?.request_id ?? record?.requestId ?? null),
    itemId: safeString(record?.item_id ?? record?.itemId ?? ""),
    itemTitle: safeString(record?.item_title ?? record?.itemTitle ?? "Borrowed Item"),
    borrowerName,
    borrowerId: safeOptionalString(record?.borrower_id ?? record?.borrowerId ?? null),
    lenderName,
    lenderId: safeOptionalString(record?.lender_id ?? record?.lenderId ?? null),
    borrowerQRCode: borrowerCode,
    lenderQRCode: lenderCode,
    startDate: normalizeDate(record?.start_date ?? record?.startDate ?? ""),
    endDate: normalizeDate(record?.end_date ?? record?.endDate ?? ""),
    meetingPlace: safeOptionalString(record?.meeting_place ?? record?.meetingPlace ?? null),
    meetingTime: normalizeTime(record?.meeting_time ?? record?.meetingTime ?? null),
    status: (record?.status ?? "scheduled") as BorrowSchedule["status"],
    returnReady: Boolean(record?.return_ready ?? record?.returnReady ?? false),
  }
}

export const mapItemRecord = (record: any): MarketplaceItem => {
  const safeNumber = (value: any, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const quantity = safeNumber(record?.quantity, 1)

  return {
    id: String(record?.id ?? record?.uuid ?? `item-${Date.now()}`),
    title: record?.title ?? "Untitled Item",
    category: record?.category ?? "Other",
    condition: record?.condition ?? "Good",
    image: record?.image_url ?? record?.image ?? null,
    ownerId: record?.owner_id ? String(record.owner_id) : null,
    lender: {
      name: record?.lender_name ?? record?.owner_name ?? "Community Lender",
      rating: safeNumber(record?.lender_rating, 0),
      reviews: safeNumber(record?.lender_reviews, 0),
      email: record?.lender_email ?? record?.owner_email ?? record?.email ?? null,
    },
    availability: record?.availability ?? (quantity > 0 ? "Available" : "Unavailable"),
    deposit: Boolean(record?.deposit ?? record?.deposit_required ?? false),
    campus: record?.campus ?? "Main Campus",
    description: record?.description ?? "",
    createdAt: record?.created_at ? new Date(record.created_at) : new Date(),
    quantity,
  }
}

export const mapBorrowRequestRecord = (record: any): BorrowRequest => {
  const safeString = (value: any) => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  const safeNumber = (value: any) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const safeOptionalNumber = (value: any) => {
    if (value === null || value === undefined) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const safeOptionalString = (value: any) => {
    if (value === null || value === undefined) return null
    return String(value)
  }

  const normalizeTime = (value: any) => {
    const raw = safeOptionalString(value)
    if (!raw) return null
    return raw.length > 5 ? raw.slice(0, 5) : raw
  }

  const safeDate = (value: any) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const rawId = record?.id ?? null
  const rawRequestId = record?.request_id ?? null
  const rawUuid = record?.uuid ?? null

  let idSource: BorrowRequest["idSource"] = "generated"
  let resolvedId: string
  if (rawId !== null && rawId !== undefined && String(rawId) !== "") {
    idSource = "id"
    resolvedId = safeString(rawId)
  } else if (rawRequestId !== null && rawRequestId !== undefined && String(rawRequestId) !== "") {
    idSource = "request_id"
    resolvedId = safeString(rawRequestId)
  } else if (rawUuid !== null && rawUuid !== undefined && String(rawUuid) !== "") {
    idSource = "uuid"
    resolvedId = safeString(rawUuid)
  } else {
    resolvedId = safeString(record?.id ?? record?.uuid ?? `req-${Date.now()}`)
  }

  return {
    id: resolvedId,
    idSource,
    rawId,
    rawUuid,
    rawRequestId,
    itemId: safeString(record?.item_id ?? record?.itemId ?? ""),
    itemTitle: record?.item_title ?? record?.itemTitle ?? "Borrowed Item",
    itemImage: record?.item_image ?? record?.itemImage ?? null,
    borrowerName: record?.borrower_name ?? record?.borrowerName ?? "Borrower",
    borrowerRating: safeNumber(record?.borrower_rating ?? record?.borrowerRating ?? 0),
    borrowerId: safeString(record?.borrower_id ?? record?.borrowerId ?? ""),
    borrowerEmail: record?.borrower_email ?? record?.borrowerEmail ?? "",
    requestDate:
      record?.created_at
        ? new Date(record.created_at)
        : record?.request_date
          ? new Date(record.request_date)
          : new Date(),
    preferredDate: safeString(record?.preferred_date ?? record?.preferredDate ?? ""),
    returnDate: safeOptionalString(record?.return_date ?? record?.returnDate ?? null),
    meetingPlace: safeOptionalString(record?.meeting_place ?? record?.meetingPlace ?? null),
    meetingTime: normalizeTime(record?.meeting_time ?? record?.meetingTime ?? null),
    message: record?.message ?? record?.borrower_message ?? "",
    status: (record?.status ?? "pending") as BorrowRequest["status"],
    ownerId: record?.owner_id
      ? safeString(record.owner_id)
      : record?.lender_id
        ? safeString(record.lender_id)
        : null,
    lenderName: record?.lender_name ?? record?.lenderName ?? "Lender",
    lenderEmail: record?.lender_email ?? record?.lenderEmail ?? null,
    decisionMessage: record?.decision_message ?? record?.decisionMessage ?? record?.response_message ?? null,
    borrowerFeedbackRating: safeOptionalNumber(
      record?.borrower_feedback_rating ?? record?.borrowerFeedbackRating ?? null,
    ),
    borrowerFeedbackMessage:
      record?.borrower_feedback_message ?? record?.borrowerFeedbackMessage ?? record?.borrower_review ?? null,
    borrowerFeedbackAt: safeDate(record?.borrower_feedback_at ?? record?.borrowerFeedbackAt ?? null),
    lenderFeedbackRating: safeOptionalNumber(record?.lender_feedback_rating ?? record?.lenderFeedbackRating ?? null),
    lenderFeedbackMessage:
      record?.lender_feedback_message ?? record?.lenderFeedbackMessage ?? record?.lender_review ?? null,
    lenderFeedbackAt: safeDate(record?.lender_feedback_at ?? record?.lenderFeedbackAt ?? null),
  }
}
