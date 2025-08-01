"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Clock, XCircle, FileText, LogOut, Filter, TrendingUp, AlertCircle } from "lucide-react"
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
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null)

  const { requisitions, loading, error, updateStatus } = useRequisitions(accessToken)

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          setAccessToken(userData.accessToken)
        }
      } catch (err) {
        console.error("Auth check failed:", err)
      }
    }

    checkAuth()
  }, [])

  // Filter requisitions based on date range, status, and team
  const filteredRequisitions = useMemo(() => {
    let filtered = requisitions

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status?.toLowerCase() === statusFilter)
    }

    // Filter by team
    if (teamFilter !== "all") {
      filtered = filtered.filter((req) => req.assignedTeam?.includes(teamFilter))
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.timestamp)
        const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01")
        const toDate = dateTo ? new Date(dateTo) : new Date("2100-12-31")
        return reqDate >= fromDate && reqDate <= toDate
      })
    }

    // Filter by user role
    if (user?.role === "submitter") {
      filtered = filtered.filter((req) => req.email === user.email)
    }

    return filtered
  }, [requisitions, statusFilter, teamFilter, dateFrom, dateTo, user])

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "pending"

    switch (statusLower) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status || "Pending"}
          </Badge>
        )
    }
  }

  const getStatsForDateRange = () => {
    return {
      total: filteredRequisitions.length,
      pending: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "pending").length,
      approved: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "approved").length,
      completed: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "completed").length,
      rejected: filteredRequisitions.filter((r) => r.status?.toLowerCase() === "rejected").length,
    }
  }

  const stats = getStatsForDateRange()
  const uniqueTeams = [...new Set(requisitions.map((req) => req.assignedTeam).filter(Boolean))]

  if (!user || !accessToken) {
    return (
      <TeamMemberLogin
        onLogin={(userData) => {
          setUser(userData)
          if (userData.role === "manager") {
            setAccessToken(userData.accessToken)
          } else {
            setAccessToken("team-member-token")
          }
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600 text-center">Fetching your requisitions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.location.reload()}>
                Retry Connection
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => window.open("/api/test-connection", "_blank")}
              >
                Test API Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Requisition Dashboard</h1>
                <p className="text-sm text-gray-600">Manage and track your requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role?.replace("_", " ")}</p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.picture || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  fetch("/api/auth/logout", { method: "POST" })
                  window.location.reload()
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium">
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium">
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Team</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {uniqueTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFrom("")
                    setDateTo("")
                    setStatusFilter("all")
                    setTeamFilter("all")
                  }}
                  className="w-full"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          {user.role === "manager" ? (
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="requisitions"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                All Requisitions
              </TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Team Management
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="requisitions"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                My Requisitions
              </TabsTrigger>
            </TabsList>
          )}

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <p className="text-xs text-gray-500 mt-1">{dateFrom || dateTo ? "In selected range" : "All time"}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.approved}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                  <div className="bg-red-100 p-2 rounded-full">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requisitions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Requisitions
                </CardTitle>
                <CardDescription>
                  {user.role === "submitter" ? "Your recent submissions" : "Latest requisition requests"}
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequisitions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requisitions found</h3>
                    <p className="text-gray-600">
                      {requisitions.length === 0
                        ? "No data found in your Google Sheet. Make sure your sheet has data and is properly configured."
                        : "No requisitions match your current filters. Try adjusting your search criteria."}
                    </p>
                    {requisitions.length === 0 && (
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => window.open("/api/test-connection", "_blank")}
                      >
                        Test Sheet Connection
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequisitions.slice(0, 10).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{req.productName || "Untitled Request"}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {req.type} • {req.assignedTeam}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted: {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"} by{" "}
                            {req.email}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(req.status)}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="hover:bg-blue-50 bg-transparent">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-xl">
                                  {req.productName || "Requisition Details"}
                                </DialogTitle>
                                <DialogDescription>Complete requisition information</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Submitter Email</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                                    <div className="mt-1">{getStatusBadge(req.status)}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Type</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.type}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Assigned Team</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.assignedTeam}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Details</Label>
                                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">{req.details}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">POC Name</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.pocName}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">POC Email</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.pocEmail}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Estimated Start Date</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.estimatedStartDate}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Expected Delivery Date</Label>
                                    <p className="text-sm text-gray-900 mt-1">{req.expectedDeliveryDate}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Delivery Timeline</Label>
                                  <p className="text-sm text-gray-900 mt-1">{req.deliveryTimeline}</p>
                                </div>
                                {req.requisitionBreakdown && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Requisition Breakdown</Label>
                                    <p className="text-sm text-gray-900 mt-1">
                                      <a
                                        href={req.requisitionBreakdown}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View Document
                                      </a>
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Submitted On</Label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {req.timestamp ? new Date(req.timestamp).toLocaleString() : "Unknown"}
                                  </p>
                                </div>
                                {(user.role === "team_member" || user.role === "manager") && (
                                  <div className="flex space-x-2 pt-4 border-t border-gray-200">
                                    <Button
                                      size="sm"
                                      onClick={() => updateStatus(req.id, "approved")}
                                      disabled={req.status === "completed"}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatus(req.id, "completed")}
                                      disabled={req.status !== "approved"}
                                      className="border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                      Mark Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatus(req.id, "rejected")}
                                      disabled={req.status === "completed"}
                                      className="border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Requisitions Tab */}
          <TabsContent value="requisitions" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  {user.role === "submitter" ? "My Requisitions" : "All Requisitions"}
                </CardTitle>
                <CardDescription>
                  Showing {filteredRequisitions.length} of {requisitions.length} requisitions
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequisitions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requisitions found</h3>
                    <p className="text-gray-600">
                      {requisitions.length === 0
                        ? "No data found in your Google Sheet."
                        : "No requisitions match your current filters."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Product/Course</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold">Submitter</TableHead>
                          <TableHead className="font-semibold">Team</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Submitted</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequisitions.map((req) => (
                          <TableRow key={req.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{req.productName || "Untitled"}</TableCell>
                            <TableCell>{req.type}</TableCell>
                            <TableCell>{req.email}</TableCell>
                            <TableCell>{req.assignedTeam}</TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell>
                              {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                {(user.role === "team_member" || user.role === "manager") && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatus(req.id, "approved")}
                                      disabled={req.status === "completed"}
                                      className="text-xs"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatus(req.id, "completed")}
                                      disabled={req.status !== "approved"}
                                      className="text-xs"
                                    >
                                      Complete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === "manager" && (
            <TabsContent value="teams" className="space-y-6">
              <TeamManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
