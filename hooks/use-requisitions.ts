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

      const headers: Record<string, string> = {}

      // Only add authorization header if we have a real token (not public or team-member-token)
      if (accessToken && accessToken !== "public" && accessToken !== "team-member-token") {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const response = await fetch("/api/requisitions", { headers })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to fetch requisitions")
      }

      const data = await response.json()
      setRequisitions(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error("Fetch error:", err)
      setRequisitions([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      console.log("=== UPDATING STATUS ===")
      console.log("ID:", id, "Status:", status)

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (accessToken && accessToken !== "public" && accessToken !== "team-member-token") {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const response = await fetch("/api/requisitions", {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, status }),
      })

      const responseData = await response.json()
      console.log("Update response:", responseData)

      if (response.ok) {
        // Update local state immediately for better UX
        setRequisitions((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)))

        // Refetch after a short delay to ensure consistency
        setTimeout(() => {
          fetchRequisitions()
        }, 2000)

        return true
      } else {
        console.error("Update error:", responseData)
        alert(`Failed to update status: ${responseData.error || "Unknown error"}`)
        return false
      }
    } catch (err) {
      console.error("Error updating status:", err)
      alert("Failed to update status. Please try again.")
      return false
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
