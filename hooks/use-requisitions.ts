"use client"

import { useState, useEffect } from "react"
import type { RequisitionData } from "@/lib/google-sheets-integration"

export function useRequisitions(accessToken: string | null) {
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/requisitions", {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to fetch requisitions")
      }

      const data = await response.json()
      setRequisitions(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error("Fetch error:", err)

      // Set empty array as fallback
      setRequisitions([])
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
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        // Update local state
        setRequisitions((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)))
      } else {
        const errorData = await response.json()
        console.error("Update error:", errorData)
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
