"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequisitions } from "@/hooks/use-requisitions"
import { TeamMemberLogin } from "@/components/team-member-login"
import { TeamManagement } from "@/components/team-management"

export default function RequisitionDashboard() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [showLogin, setShowLogin] = useState(false)
  const [viewMode, setViewMode] = useState<"public" | "authenticated">("public")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [authChecked, setAuthChecked] = useState(false)
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null)

  const { requisitions, loading, error, updateStatus, refetch } = useRequisitions(accessToken || "public")

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          setAccessToken(userData.accessToken)
          setViewMode("authenticated")
        } else {
          setAccessToken("public")
          setViewMode("public")
        }
      } catch (err) {
        setAccessToken("public")
        setViewMode("public")
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  // Filter requisitions
  const filteredRequisitions = useMemo(() => {
    let filtered = requisitions

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status?.toLowerCase() === statusFilter)
    }
    if (teamFilter !== "all") {
      filtered = filtered.filter((req) => req.assignedTeam?.includes(teamFilter))
    }
    if (dateFrom || dateTo) {
      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.timestamp)
        const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01")
        const toDate = dateTo ? new Date(dateTo) : new Date("2100-12-31")
        return reqDate >= fromDate && reqDate <= toDate
      })
    }
    if (user?.role === "submitter") {
      filtered = filtered.filter((req) => req.email === user.email)
    }
    return filtered
  }, [requisitions, statusFilter, teamFilter, dateFrom, dateTo, user])

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "pending"
    const statusConfig = {
      pending: { class: "badge-pending", icon: "bi-clock", label: "Pending" },
      approved: { class: "badge-approved", icon: "bi-check-circle", label: "Approved" },
      completed: { class: "badge-completed", icon: "bi-check-circle-fill", label: "Completed" },
      rejected: { class: "badge-rejected", icon: "bi-x-circle", label: "Rejected" },
    }
    const config = statusConfig[statusLower as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`badge ${config.class}`}>
        <i className={`${config.icon} me-1`}></i>
        {config.label}
      </span>
    )
  }

  const getStats = () => {
    return {
      total: filteredRequisitions.length,
      pending: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "pending").length,
      approved: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "approved").length,
      completed: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "completed").length,
      rejected: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "rejected").length,
    }
  }

  const stats = getStats()
  const uniqueTeams = [...new Set(requisitions.map((req) => req.assignedTeam).filter(Boolean))]

  const handleLogin = (userData: any) => {
    setUser(userData)
    if (userData.role === "manager") {
      setAccessToken(userData.accessToken)
    } else {
      setAccessToken("team-member-token")
    }
    setViewMode("authenticated")
    setShowLogin(false)
    refetch()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch (error) {
      console.error("Logout error:", error)
    }
    setUser(null)
    setAccessToken("public")
    setViewMode("public")
    setActiveTab("dashboard")
    refetch()
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const success = await updateStatus(id, newStatus)
    if (success) {
      // Show success message
      const alertDiv = document.createElement("div")
      alertDiv.className = "alert alert-success alert-dismissible fade show position-fixed"
      alertDiv.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;"
      alertDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        Status updated to <strong>${newStatus}</strong> successfully!
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
      `
      document.body.appendChild(alertDiv)

      // Auto remove after 3 seconds
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv)
        }
      }, 3000)

      // Refresh data after a short delay
      setTimeout(() => refetch(), 1500)
    }
  }

  // Show login component if explicitly requested
  if (showLogin) {
    return <TeamMemberLogin onLogin={handleLogin} />
  }

  // Show loading only if auth hasn't been checked yet
  if (!authChecked || (loading && !requisitions.length)) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="loading-container">
          <div className="loading-spinner mb-4"></div>
          <h3 className="text-center mb-3">Loading Dashboard</h3>
          <p className="text-center text-muted">Connecting to Google Sheets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card text-center">
                <div className="card-body p-5">
                  <div className="mb-4">
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "4rem" }}></i>
                  </div>
                  <h2 className="text-danger mb-3">Connection Error</h2>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-grid gap-2">
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry Connection
                    </button>
                    <div className="row">
                      <div className="col-6">
                        <button
                          className="btn btn-outline-secondary w-100"
                          onClick={() => window.open("/api/test-connection", "_blank")}
                        >
                          Test API
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          className="btn btn-outline-secondary w-100"
                          onClick={() => window.open("/api/debug-columns", "_blank")}
                        >
                          Debug
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light sticky-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <i className="bi bi-file-text me-2" style={{ fontSize: "1.5rem" }}></i>
            Requisition Management System
          </a>
          <div className="d-flex align-items-center">
            {viewMode === "public" ? (
              <div className="d-flex align-items-center">
                <span className="badge bg-success me-3">
                  <i className="bi bi-globe me-1"></i>
                  Public View
                </span>
                <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Team Login
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <div className="me-3 text-end">
                  <div className="fw-bold">{user?.name}</div>
                  <small className="text-muted text-capitalize">
                    {user?.role?.replace("_", " ")} {user?.team && `• ${user.team}`}
                  </small>
                </div>
                <div className="dropdown">
                  <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i className="bi bi-person-circle me-1"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container my-4">
        {/* Page Header */}
        {/* ... (keep your header, stats, filters, and tabs as before) ... */}

        {/* Content based on active tab */}
        {(activeTab === "dashboard" || viewMode === "public" || user?.role === "team_member") && (
          <div className="row">
            <div className="col">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    {viewMode === "public"
                      ? "All Requisitions"
                      : user?.role === "team_member"
                        ? "Requisitions for Review"
                        : "Recent Requisitions"}
                  </h5>
                </div>
                <div className="card-body">
                  {filteredRequisitions.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox text-muted" style={{ fontSize: "4rem" }}></i>
                      <h4 className="text-muted mt-3">No requisitions found</h4>
                      <p className="text-muted">
                        {requisitions.length === 0
                          ? "No data found in your Google Sheet."
                          : "No requisitions match your current filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Product/Course</th>
                            <th>Type</th>
                            <th>Submitter</th>
                            <th>Team</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            {(user?.role === "team_member" || user?.role === "manager") && <th>Actions</th>}
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequisitions.slice(0, 20).map((req) => (
                            <React.Fragment key={req.id}>
                              <tr>
                                <td>
                                  <strong>{req.productName || "Untitled"}</strong>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark">{req.type}</span>
                                </td>
                                <td>{req.email}</td>
                                <td>
                                  <span className="badge bg-info">{req.assignedTeam}</span>
                                </td>
                                <td>{getStatusBadge(req.status)}</td>
                                <td>{req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"}</td>
                                {(user?.role === "team_member" || user?.role === "manager") && (
                                  <td>
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        className="btn btn-success"
                                        onClick={() => handleStatusUpdate(req.id, "approved")}
                                        disabled={req.status === "completed" || req.status === "approved"}
                                        title="Approve"
                                      >
                                        <i className="bi bi-check"></i>
                                      </button>
                                      <button
                                        className="btn btn-primary"
                                        onClick={() => handleStatusUpdate(req.id, "completed")}
                                        disabled={req.status !== "approved"}
                                        title="Mark Complete"
                                      >
                                        <i className="bi bi-check-circle-fill"></i>
                                      </button>
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => handleStatusUpdate(req.id, "rejected")}
                                        disabled={req.status === "completed" || req.status === "rejected"}
                                        title="Reject"
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    </div>
                                  </td>
                                )}
                                <td>
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => setOpenDetailsId(req.id)}
                                  >
                                    <i className="bi bi-eye me-1"></i>
                                    View
                                  </button>
                                </td>
                              </tr>
                              {openDetailsId === req.id && (
                                <tr>
                                  <td colSpan={8}>
                                    <div className="card my-3">
                                      <div className="card-header d-flex justify-content-between align-items-center">
                                        <span>
                                          <i className="bi bi-file-text me-2"></i>
                                          {req.productName || "Requisition Details"}
                                        </span>
                                        <button
                                          className="btn btn-sm btn-secondary"
                                          onClick={() => setOpenDetailsId(null)}
                                        >
                                          <i className="bi bi-x-lg me-1"></i>
                                          Close
                                        </button>
                                      </div>
                                      <div className="card-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                                        <div className="row g-4">
                                          {/* Basic Information */}
                                          <div className="col-12">
                                            <div className="card">
                                              <div className="card-header">
                                                <h6 className="mb-0">
                                                  <i className="bi bi-info-circle me-2"></i>Basic Information
                                                </h6>
                                              </div>
                                              <div className="card-body">
                                                <div className="row">
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Product/Course Name
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      {req.productName || "Not specified"}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Request Type
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <span className="badge bg-secondary">
                                                        {req.type || "Not specified"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Current Status
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      {getStatusBadge(req.status)}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Assigned Team
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <span className="badge bg-info">
                                                        {req.assignedTeam || "Not assigned"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Contact Information */}
                                          <div className="col-12">
                                            <div className="card">
                                              <div className="card-header">
                                                <h6 className="mb-0">
                                                  <i className="bi bi-person-lines-fill me-2"></i>Contact Information
                                                </h6>
                                              </div>
                                              <div className="card-body">
                                                <div className="row">
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Submitter Email
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-envelope me-2"></i>
                                                      {req.email || "Not provided"}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">POC Name</label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-person me-2"></i>
                                                      {req.pocName || "Not provided"}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">POC Email</label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-envelope me-2"></i>
                                                      {req.pocEmail || "Not provided"}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Project Details */}
                                          <div className="col-12">
                                            <div className="card">
                                              <div className="card-header">
                                                <h6 className="mb-0">
                                                  <i className="bi bi-clipboard-data me-2"></i>Project Details
                                                </h6>
                                              </div>
                                              <div className="card-body">
                                                <div className="row">
                                                  <div className="col-12 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Request Details
                                                    </label>
                                                    <div
                                                      className="p-3 bg-light rounded"
                                                      style={{ minHeight: "100px" }}
                                                    >
                                                      {req.details || "No details provided"}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Delivery Timeline
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-clock me-2"></i>
                                                      {req.deliveryTimeline || "Not specified"}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Estimated Start Date
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-calendar-event me-2"></i>
                                                      {req.estimatedStartDate || "Not specified"}
                                                    </div>
                                                  </div>
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Expected Delivery Date
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-calendar-check me-2"></i>
                                                      {req.expectedDeliveryDate || "Not specified"}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Additional Information */}
                                          <div className="col-12">
                                            <div className="card">
                                              <div className="card-header">
                                                <h6 className="mb-0">
                                                  <i className="bi bi-plus-circle me-2"></i>Additional Information
                                                </h6>
                                              </div>
                                              <div className="card-body">
                                                <div className="row">
                                                  {req.requisitionBreakdown && (
                                                    <div className="col-md-6 mb-3">
                                                      <label className="form-label fw-bold text-primary">
                                                        Requisition Breakdown
                                                      </label>
                                                      <div className="p-2 bg-light rounded">
                                                        <a
                                                          href={req.requisitionBreakdown}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="btn btn-outline-primary btn-sm"
                                                        >
                                                          <i className="bi bi-file-text me-1"></i>
                                                          View Document
                                                        </a>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-bold text-primary">
                                                      Submission Date
                                                    </label>
                                                    <div className="p-2 bg-light rounded">
                                                      <i className="bi bi-calendar3 me-2"></i>
                                                      {req.timestamp
                                                        ? new Date(req.timestamp).toLocaleString()
                                                        : "Unknown"}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Management Tab (Manager Only) */}
        {activeTab === "teams" && viewMode === "authenticated" && user?.role === "manager" && (
          <div className="row">
            <div className="col">
              <TeamManagement />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
