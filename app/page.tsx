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
import { CheckCircle, Clock, XCircle, FileText, LogOut, Filter } from "lucide-react"
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
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
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
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    // Filter by team
    if (teamFilter !== "all") {
      filtered = filtered.filter((req) => req.assignedTeam.includes(teamFilter))
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
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const getStatsForDateRange = () => {
    return {
      total: filteredRequisitions.length,
      pending: filteredRequisitions.filter((r) => r.status.toLowerCase() === "pending").length,
      approved: filteredRequisitions.filter((r) => r.status.toLowerCase() === "approved").length,
      completed: filteredRequisitions.filter((r) => r.status.toLowerCase() === "completed").length,
      rejected: filteredRequisitions.filter((r) => r.status.toLowerCase() === "rejected").length,
    }
  }

  const stats = getStatsForDateRange()

  const uniqueTeams = [...new Set(requisitions.map((req) => req.assignedTeam).filter(Boolean))]

  if (!user || !accessToken) {
    return (
      <TeamMemberLogin
        onLogin={(userData) => {
          setUser(userData)
          // For team members, we don't need Google access token for sheets
          if (userData.role === "manager") {
            setAccessToken(userData.accessToken)
          } else {
            setAccessToken("team-member-token") // Placeholder for team members
          }
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requisitions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Requisition Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={user.picture || "/placeholder.svg"} />
                <AvatarFallback>
                  {user.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-gray-500 capitalize">{user.role?.replace("_", " ")}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  fetch("/api/auth/logout", { method: "POST" })
                  window.location.reload()
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
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
                <Label>Team</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
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
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          {user.role === "manager" && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="requisitions">All Requisitions</TabsTrigger>
              <TabsTrigger value="teams">Team Management</TabsTrigger>
            </TabsList>
          )}
          {user.role !== "manager" && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="requisitions">All Requisitions</TabsTrigger>
            </TabsList>
          )}

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {dateFrom || dateTo ? "In selected range" : "All time"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.approved}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.rejected}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : "0%"} of total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requisitions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Requisitions</CardTitle>
                <CardDescription>
                  {user.role === "submitter" ? "Your recent submissions" : "Latest requisition requests"}
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequisitions.slice(0, 10).map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{req.productName}</h4>
                        <p className="text-sm text-gray-500">
                          {req.type} • {req.assignedTeam}
                        </p>
                        <p className="text-xs text-gray-400">
                          Submitted: {new Date(req.timestamp).toLocaleDateString()} by {req.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(req.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{req.productName}</DialogTitle>
                              <DialogDescription>Requisition Details</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Submitter Email</Label>
                                  <p className="text-sm">{req.email}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <div className="mt-1">{getStatusBadge(req.status)}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Type</Label>
                                  <p className="text-sm">{req.type}</p>
                                </div>
                                <div>
                                  <Label>Assigned Team</Label>
                                  <p className="text-sm">{req.assignedTeam}</p>
                                </div>
                              </div>
                              <div>
                                <Label>Details</Label>
                                <p className="text-sm mt-1">{req.details}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>POC Name</Label>
                                  <p className="text-sm">{req.pocName}</p>
                                </div>
                                <div>
                                  <Label>POC Email</Label>
                                  <p className="text-sm">{req.pocEmail}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Estimated Start Date</Label>
                                  <p className="text-sm">{req.estimatedStartDate}</p>
                                </div>
                                <div>
                                  <Label>Expected Delivery Date</Label>
                                  <p className="text-sm">{req.expectedDeliveryDate}</p>
                                </div>
                              </div>
                              <div>
                                <Label>Delivery Timeline</Label>
                                <p className="text-sm">{req.deliveryTimeline}</p>
                              </div>
                              {req.requisitionBreakdown && (
                                <div>
                                  <Label>Requisition Breakdown</Label>
                                  <p className="text-sm">
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
                                <Label>Submitted On</Label>
                                <p className="text-sm">{new Date(req.timestamp).toLocaleString()}</p>
                              </div>
                              {(user.role === "team_member" || user.role === "manager") && (
                                <div className="flex space-x-2 pt-4 border-t">
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(req.id, "approved")}
                                    disabled={req.status === "completed"}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(req.id, "completed")}
                                    disabled={req.status !== "approved"}
                                  >
                                    Mark Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateStatus(req.id, "rejected")}
                                    disabled={req.status === "completed"}
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
                  {filteredRequisitions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No requisitions found for the selected filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Requisitions Tab */}
          <TabsContent value="requisitions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Requisitions</CardTitle>
                <CardDescription>
                  Showing {filteredRequisitions.length} of {requisitions.length} requisitions
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product/Course</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequisitions.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.productName}</TableCell>
                        <TableCell>{req.type}</TableCell>
                        <TableCell>{req.email}</TableCell>
                        <TableCell>{req.assignedTeam}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {(user.role === "team_member" || user.role === "manager") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(req.id, "approved")}
                                  disabled={req.status === "completed"}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(req.id, "completed")}
                                  disabled={req.status !== "approved"}
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
