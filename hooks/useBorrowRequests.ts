"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseclient"
import { mapBorrowRequestRecord } from "@/lib/mappers"
import type { BorrowRequest } from "@/types/interfaces"

export function useBorrowRequests(userId: string | null | undefined) {
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([])

  const fetchBorrowRequests = useCallback(async () => {
    if (!userId) {
      setBorrowRequests([])
      return
    }

    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .select("*")
        .or(`borrower_id.eq.${userId},owner_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Failed to load borrow requests", error)
        setBorrowRequests([])
        return
      }

      const mapped = (data ?? []).map(mapBorrowRequestRecord)
      mapped.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
      setBorrowRequests(mapped)
    } catch (err) {
      console.error("Unexpected error while loading borrow requests", err)
      setBorrowRequests([])
    }
  }, [userId])

  useEffect(() => {
    void fetchBorrowRequests()
  }, [fetchBorrowRequests])

  useEffect(() => {
    if (!userId) {
      return
    }

    const handleChange = (payload: any) => {
      const eventType = payload?.eventType
      if (eventType === "DELETE") {
        const removedId = payload?.old?.id ?? payload?.old?.uuid
        if (!removedId) return
        setBorrowRequests((prev) => prev.filter((req) => req.id !== String(removedId)))
        return
      }

      const record = payload?.new
      if (!record) return
      const mapped = mapBorrowRequestRecord(record)
      setBorrowRequests((prev) => {
        const existingIndex = prev.findIndex((req) => req.id === mapped.id)
        if (existingIndex >= 0) {
          const next = [...prev]
          next[existingIndex] = mapped
          next.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
          return next
        }
        const next = [mapped, ...prev]
        next.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
        return next
      })
    }

    const channel = supabase
      .channel(`borrow-requests-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_requests", filter: `owner_id=eq.${userId}` },
        handleChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_requests", filter: `borrower_id=eq.${userId}` },
        handleChange,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    borrowRequests,
    setBorrowRequests,
    refreshBorrowRequests: fetchBorrowRequests,
  }
}
