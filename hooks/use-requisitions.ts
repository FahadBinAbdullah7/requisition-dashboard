"use client"

import { useState, useEffect } from "react"
import type { RequisitionData } from "@/lib/google-sheets-integration"

export function useRequisitions(accessToken: string | null) {
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequisitions = async () => {
    if (!accessToken) return

    try {
      setLoading(true)
      const response = await fetch("/api/requisitions", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch requisitions")
      }

      const data = await response.json()
      setRequisitions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/requisitions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        // Update local state
        setRequisitions((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)))
      }
    } catch (err) {
      console.error("Error updating status:", err)
    }
  }

  useEffect(() => {
    fetchRequisitions()
  }, [accessToken])

  return {
    requisitions,
    loading,
    error,
    refetch: fetchRequisitions,
    updateStatus,
  }
}
