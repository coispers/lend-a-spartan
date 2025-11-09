"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseclient"
import { mapBorrowScheduleRecord } from "@/lib/mappers"
import { slugify } from "@/lib/home-utils"
import type { BorrowRequest, BorrowSchedule } from "@/types/interfaces"

interface UseBorrowSchedulesOptions {
  currentUserId: string | null | undefined
  borrowRequests: BorrowRequest[]
}

export function useBorrowSchedules({ currentUserId, borrowRequests }: UseBorrowSchedulesOptions) {
  const [borrowSchedules, setBorrowSchedules] = useState<BorrowSchedule[]>([])

  const fetchBorrowSchedules = useCallback(async () => {
    if (!currentUserId) {
      setBorrowSchedules([])
      return
    }

    try {
      const { data, error } = await supabase
        .from("borrow_schedules")
        .select("*")
        .or(`borrower_id.eq.${currentUserId},lender_id.eq.${currentUserId}`)
        .order("start_date", { ascending: false })

      if (error) {
        console.error("Failed to load borrow schedules", error)
        return
      }

      const mapped = (data ?? []).map((record) => mapBorrowScheduleRecord(record))
      setBorrowSchedules(mapped)
    } catch (err) {
      console.error("Unexpected error while loading borrow schedules", err)
    }
  }, [currentUserId])

  useEffect(() => {
    void fetchBorrowSchedules()
  }, [fetchBorrowSchedules])

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const handleChange = () => {
      void fetchBorrowSchedules()
    }

    const channel = supabase
      .channel(`borrow-schedules-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_schedules", filter: `borrower_id=eq.${currentUserId}` },
        handleChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_schedules", filter: `lender_id=eq.${currentUserId}` },
        handleChange,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, fetchBorrowSchedules])

  const requestStageOverrides = useMemo(() => {
    const map = new Map<string, BorrowRequest["status"]>()
    borrowSchedules.forEach((schedule) => {
      if (!schedule.requestId) return
      if (schedule.status === "borrowed") {
        map.set(schedule.requestId, "ongoing")
      } else if (schedule.status === "completed") {
        map.set(schedule.requestId, "completed")
      }
    })
    return map
  }, [borrowSchedules])

  const scheduleCards = useMemo(() => {
    const scheduleList: BorrowSchedule[] = [...borrowSchedules]
    const fulfilledRequestIds = new Set(
      borrowSchedules
        .map((schedule) => schedule.requestId)
        .filter((value): value is string => Boolean(value)),
    )

    borrowRequests.forEach((request) => {
      if (request.status !== "approved") {
        return
      }

      if (request.id && fulfilledRequestIds.has(request.id)) {
        return
      }

      const placeholderId = `request-${request.id}`
      const startDate = request.preferredDate || ""
      const endDate = request.returnDate || request.preferredDate || ""

      scheduleList.push({
        id: placeholderId,
        requestId: request.id,
        itemId: request.itemId,
        itemTitle: request.itemTitle,
        borrowerName: request.borrowerName,
        borrowerId: request.borrowerId || null,
        lenderName: request.lenderName,
        lenderId: request.ownerId || null,
        borrowerQRCode: `borrower-${slugify(request.borrowerName)}-${placeholderId}`,
        lenderQRCode: `lender-${slugify(request.lenderName)}-${placeholderId}`,
        startDate,
        endDate,
        meetingPlace: request.meetingPlace,
        meetingTime: request.meetingTime,
        status: "scheduled",
        returnReady: false,
      })
    })

    scheduleList.sort((a, b) => {
      const aTime = new Date(a.startDate || 0).getTime()
      const bTime = new Date(b.startDate || 0).getTime()
      return bTime - aTime
    })

    return scheduleList
  }, [borrowRequests, borrowSchedules])

  return {
    borrowSchedules,
    setBorrowSchedules,
    requestStageOverrides,
    scheduleCards,
    refreshBorrowSchedules: fetchBorrowSchedules,
  }
}
