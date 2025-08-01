"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useRequisitions } from "@/hooks/use-requisitions"
import { TeamManagement } from "@/components/team-management"

export default function AuthenticatedDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null)

  const { requisitions, loading: dataLoading, error, updateStatus, refetch } = useRequisitions(accessToken)

  // Check authentication on mount
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
        } else {
          // Not authenticated, redirect to login
          router.push("/login")
          return
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        router.push("/login")
        return
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch (error) {
      console.error("Logout error:", error)
    }
    router.push("/")
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

  const openModal = (req: any) => {
    setSelectedRequisition(req)
    document.body.style.overflow = "hidden"
  }

  const closeModal = () => {
    setSelectedRequisition(null)
    document.body.style.overflow = "auto"
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedRequisition) {
        closeModal()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [selectedRequisition])

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="loading-container">
          <div className="loading-spinner mb-4"></div>
          <h3 className="text-center mb-3">Loading Dashboard</h3>
          <p className="text-center text-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
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
          <a className="navbar-brand d-flex align-items-center" href="/dashboard">
            <i className="bi bi-file-text me-2" style={{ fontSize: "1.5rem" }}></i>
            Requisition Management System
          </a>

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
                  <button className="dropdown-item" onClick={() => router.push("/")}>
                    <i className="bi bi-globe me-2"></i>
                    Public View
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container my-4">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col">
            <div className="card">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <h1 className="text-gradient mb-2">
                      {user?.role === "manager"
                        ? "Manager Dashboard"
                        : user?.role === "team_member"
                          ? "Team Member Dashboard"
                          : "Dashboard"}
                    </h1>
                    <p className="text-muted mb-0">
                      {user?.role === "manager"
                        ? "Manage requisitions, teams, and system settings"
                        : user?.role === "team_member"
                          ? `Review and approve requisitions for ${user?.team || "your team"}`
                          : "Manage your requisition requests"}
                    </p>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-outline-primary" onClick={refetch} disabled={dataLoading}>
                      {dataLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Refresh Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-2 col-sm-6 mb-3">
            <div className="stats-card">
              <div className="stats-icon bg-gradient-primary">
                <i className="bi bi-file-text"></i>
              </div>
              <h6 className="text-muted text-uppercase">Total Requests</h6>
              <div className="stats-number">{stats.total}</div>
              <small className="text-muted">All time</small>
            </div>
          </div>
          <div className="col-md-2 col-sm-6 mb-3">
            <div className="stats-card">
              <div className="stats-icon bg-gradient-warning">
                <i className="bi bi-clock"></i>
              </div>
              <h6 className="text-muted text-uppercase">Pending</h6>
              <div className="stats-number">{stats.pending}</div>
              <small className="text-muted">
                {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total
              </small>
            </div>
          </div>
          <div className="col-md-2 col-sm-6 mb-3">
            <div className="stats-card">
              <div className="stats-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                <i className="bi bi-check-circle"></i>
              </div>
              <h6 className="text-muted text-uppercase">Approved</h6>
              <div className="stats-number">{stats.approved}</div>
              <small className="text-muted">
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total
              </small>
            </div>
          </div>
          <div className="col-md-2 col-sm-6 mb-3">
            <div className="stats-card">
              <div className="stats-icon bg-gradient-success">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h6 className="text-muted text-uppercase">Completed</h6>
              <div className="stats-number">{stats.completed}</div>
              <small className="text-muted">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total
              </small>
            </div>
          </div>
          <div className="col-md-2 col-sm-6 mb-3">
            <div className="stats-card">
              <div className="stats-icon bg-gradient-danger">
                <i className="bi bi-x-circle"></i>
              </div>
              <h6 className="text-muted text-uppercase">Rejected</h6>
              <div className="stats-number">{stats.rejected}</div>
              <small className="text-muted">
                {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% of total
              </small>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Managers */}
        {user?.role === "manager" && (
          <div className="row mb-4">
            <div className="col">
              <ul className="nav nav-pills nav-fill">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "teams" ? "active" : ""}`}
                    onClick={() => setActiveTab("teams")}
                  >
                    <i className="bi bi-people me-2"></i>
                    Team Management
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {(activeTab === "dashboard" || user?.role === "team_member") && (
          <>
            {/* Filters */}
            <div className="row mb-4">
              <div className="col">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-funnel me-2"></i>
                      Filters & Search
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-2 mb-3">
                        <label className="form-label">From Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label">To Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label">Team</label>
                        <select
                          className="form-select"
                          value={teamFilter}
                          onChange={(e) => setTeamFilter(e.target.value)}
                        >
                          <option value="all">All Teams</option>
                          {uniqueTeams.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label">&nbsp;</label>
                        <button
                          className="btn btn-outline-secondary w-100"
                          onClick={() => {
                            setDateFrom("")
                            setDateTo("")
                            setStatusFilter("all")
                            setTeamFilter("all")
                          }}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requisitions Table */}
            <div className="row">
              <div className="col">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-list-ul me-2"></i>
                      {user?.role === "team_member" ? "Requisitions for Review" : "All Requisitions"} (
                      {filteredRequisitions.length})
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
                              <th>Actions</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRequisitions.map((req) => (
                              <tr key={req.id}>
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
                                <td>
                                  <button className="btn btn-outline-primary btn-sm" onClick={() => openModal(req)}>
                                    <i className="bi bi-eye me-1"></i>
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Team Management Tab (Manager Only) */}
        {activeTab === "teams" && user?.role === "manager" && (
          <div className="row">
            <div className="col">
              <TeamManagement />
            </div>
          </div>
        )}
      </div>

      {/* Custom Modal */}
      {selectedRequisition && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h5 className="custom-modal-title">
                <i className="bi bi-file-text me-2"></i>
                {selectedRequisition.productName || "Requisition Details"}
              </h5>
              <button className="custom-modal-close" onClick={closeModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="custom-modal-body">
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
                          <label className="form-label fw-bold text-primary">Product/Course Name</label>
                          <div className="p-2 bg-light rounded">
                            {selectedRequisition.productName || "Not specified"}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">Request Type</label>
                          <div className="p-2 bg-light rounded">
                            <span className="badge bg-secondary">{selectedRequisition.type || "Not specified"}</span>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">Current Status</label>
                          <div className="p-2 bg-light rounded">{getStatusBadge(selectedRequisition.status)}</div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">Assigned Team</label>
                          <div className="p-2 bg-light rounded">
                            <span className="badge bg-info">{selectedRequisition.assignedTeam || "Not assigned"}</span>
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
                          <label className="form-label fw-bold text-primary">Submitter Email</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-envelope me-2"></i>
                            {selectedRequisition.email || "Not provided"}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">POC Name</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-person me-2"></i>
                            {selectedRequisition.pocName || "Not provided"}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">POC Email</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-envelope me-2"></i>
                            {selectedRequisition.pocEmail || "Not provided"}
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
                          <label className="form-label fw-bold text-primary">Request Details</label>
                          <div
                            className="p-3 bg-light rounded"
                            style={{ minHeight: "100px", maxHeight: "200px", overflowY: "auto" }}
                          >
                            {selectedRequisition.details || "No details provided"}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">Delivery Timeline</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-clock me-2"></i>
                            {selectedRequisition.deliveryTimeline || "Not specified"}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">Estimated Start Date</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-calendar-event me-2"></i>
                            {selectedRequisition.estimatedStartDate || "Not specified"}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold text-primary">Expected Delivery Date</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-calendar-check me-2"></i>
                            {selectedRequisition.expectedDeliveryDate || "Not specified"}
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
                        {selectedRequisition.requisitionBreakdown && (
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold text-primary">Requisition Breakdown</label>
                            <div className="p-2 bg-light rounded">
                              <a
                                href={selectedRequisition.requisitionBreakdown}
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
                          <label className="form-label fw-bold text-primary">Submission Date</label>
                          <div className="p-2 bg-light rounded">
                            <i className="bi bi-calendar3 me-2"></i>
                            {selectedRequisition.timestamp
                              ? new Date(selectedRequisition.timestamp).toLocaleString()
                              : "Unknown"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="custom-modal-footer">
              {(user?.role === "team_member" || user?.role === "manager") && (
                <div className="btn-group me-auto">
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      handleStatusUpdate(selectedRequisition.id, "approved")
                      closeModal()
                    }}
                    disabled={selectedRequisition.status === "completed" || selectedRequisition.status === "approved"}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Approve
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleStatusUpdate(selectedRequisition.id, "completed")
                      closeModal()
                    }}
                    disabled={selectedRequisition.status !== "approved"}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Complete
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      handleStatusUpdate(selectedRequisition.id, "rejected")
                      closeModal()
                    }}
                    disabled={selectedRequisition.status === "completed" || selectedRequisition.status === "rejected"}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Reject
                  </button>
                </div>
              )}
              <button className="btn btn-secondary" onClick={closeModal}>
                <i className="bi bi-x-lg me-1"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
