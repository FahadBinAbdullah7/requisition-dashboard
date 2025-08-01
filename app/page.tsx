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
import {
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  LogOut,
  Filter,
  TrendingUp,
  AlertCircle,
  LogIn,
  Eye,
  UserCheck,
  BarChart3,
  Users,
  Calendar,
  Search,
} from "lucide-react"
import { useRequisitions } from "@/hooks/use-requisitions"
import { TeamMemberLogin } from "@/components/team-member-login"
import { TeamManagement } from "@/components/team-management"

export default function RequisitionDashboard() {
  const [accessToken, setAccessToken] = useState<string | null>("public")
  const [user, setUser] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [showLogin, setShowLogin] = useState(false)
  const [viewMode, setViewMode] = useState<"public" | "authenticated">("public")

  const { requisitions, loading, error, updateStatus, refetch } = useRequisitions(accessToken)

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          setAccessToken(userData.accessToken)
          setViewMode("authenticated")
        }
      } catch (err) {
        console.log("No existing auth, staying in public mode")
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

    const badgeClasses = {
      pending: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-200 shadow-sm",
      approved: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200 shadow-sm",
      completed: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200 shadow-sm",
      rejected: "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200 shadow-sm",
    }

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1.5" />,
      approved: <CheckCircle className="w-3 h-3 mr-1.5" />,
      completed: <CheckCircle className="w-3 h-3 mr-1.5" />,
      rejected: <XCircle className="w-3 h-3 mr-1.5" />,
    }

    return (
      <Badge
        variant="secondary"
        className={`${badgeClasses[statusLower as keyof typeof badgeClasses] || badgeClasses.pending} font-medium px-3 py-1 text-xs`}
      >
        {icons[statusLower as keyof typeof icons] || icons.pending}
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
      </Badge>
    )
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

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setAccessToken("public")
    setViewMode("public")
    refetch()
  }

  if (showLogin) {
    return <TeamMemberLogin onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-strong border-0 animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600 text-center">Fetching requisitions from Google Sheets...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-strong border-red-200 animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600 text-xl">Connection Error</CardTitle>
            <CardDescription className="text-gray-600">Unable to connect to Google Sheets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full bg-red-600 hover:bg-red-700 btn-hover" onClick={() => window.location.reload()}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="bg-white/50 hover:bg-white/80"
                  onClick={() => window.open("/api/test-connection", "_blank")}
                >
                  Test API
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/50 hover:bg-white/80"
                  onClick={() => window.open("/api/debug-columns", "_blank")}
                >
                  Debug Sheet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-soft border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center animate-fade-in">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl mr-4 shadow-medium">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Requisition Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {viewMode === "public" ? "Public View - All Requisitions" : "Authenticated Dashboard"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 animate-fade-in">
              {viewMode === "public" ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setShowLogin(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-medium btn-hover"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Team Login
                  </Button>
                  <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 px-4 py-2 shadow-sm">
                    <Eye className="h-3 w-3 mr-1.5" />
                    Public View
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
                  </div>
                  <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-medium">
                    <AvatarImage src={user?.picture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-lg">
                      {user?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8 shadow-medium border-0 bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-gray-800">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl">
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
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-1.5" />
                  Team
                </Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl">
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
                  className="w-full bg-white/70 hover:bg-white/90 border-gray-200 rounded-xl btn-hover"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-8">
          {viewMode === "authenticated" && user?.role === "manager" ? (
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-medium border-0 p-1 rounded-2xl">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-medium rounded-xl font-medium"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="requisitions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-medium rounded-xl font-medium"
              >
                All Requisitions
              </TabsTrigger>
              <TabsTrigger
                value="teams"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-medium rounded-xl font-medium"
              >
                Team Management
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-medium border-0 p-1 rounded-2xl">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-medium rounded-xl font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="requisitions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-medium rounded-xl font-medium"
              >
                {viewMode === "public"
                  ? "All Requisitions"
                  : user?.role === "submitter"
                    ? "My Requisitions"
                    : "All Requisitions"}
              </TabsTrigger>
            </TabsList>
          )}

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                {
                  title: "Total Requests",
                  value: stats.total,
                  icon: FileText,
                  color: "blue",
                  bgGradient: "from-blue-500 to-indigo-500",
                  description: dateFrom || dateTo ? "In selected range" : "All time",
                },
                {
                  title: "Pending",
                  value: stats.pending,
                  icon: Clock,
                  color: "amber",
                  bgGradient: "from-amber-500 to-yellow-500",
                  description: `${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total`,
                },
                {
                  title: "Approved",
                  value: stats.approved,
                  icon: CheckCircle,
                  color: "blue",
                  bgGradient: "from-blue-500 to-cyan-500",
                  description: `${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total`,
                },
                {
                  title: "Completed",
                  value: stats.completed,
                  icon: CheckCircle,
                  color: "emerald",
                  bgGradient: "from-emerald-500 to-green-500",
                  description: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total`,
                },
                {
                  title: "Rejected",
                  value: stats.rejected,
                  icon: XCircle,
                  color: "red",
                  bgGradient: "from-red-500 to-rose-500",
                  description: `${stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% of total`,
                },
              ].map((stat, index) => (
                <Card
                  key={stat.title}
                  className="shadow-medium hover:shadow-strong transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                    <div className={`bg-gradient-to-r ${stat.bgGradient} p-2.5 rounded-xl shadow-sm`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold text-${stat.color}-600 mb-1`}>{stat.value}</div>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Requisitions */}
            <Card className="shadow-medium border-0 bg-white/80 backdrop-blur-sm animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2.5 rounded-xl mr-3 shadow-sm">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Recent Requisitions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {viewMode === "public"
                    ? "Latest requisition requests from all teams"
                    : user?.role === "submitter"
                      ? "Your recent submissions"
                      : "Latest requisition requests"}
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequisitions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No requisitions found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {requisitions.length === 0
                        ? "No data found in your Google Sheet. Make sure your sheet has data and is properly configured."
                        : "No requisitions match your current filters. Try adjusting your search criteria."}
                    </p>
                    {requisitions.length === 0 && (
                      <div className="flex justify-center space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => window.open("/api/test-connection", "_blank")}
                          className="bg-white/70 hover:bg-white/90 btn-hover"
                        >
                          Test Connection
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open("/api/debug-columns", "_blank")}
                          className="bg-white/70 hover:bg-white/90 btn-hover"
                        >
                          Debug Sheet
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequisitions.slice(0, 10).map((req, index) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-6 border border-gray-200 rounded-2xl hover:bg-white/70 transition-all duration-300 hover:shadow-medium animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg mb-2">
                            {req.productName || "Untitled Request"}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{req.type}</span> • {req.assignedTeam}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"} by{" "}
                            <span className="font-medium">{req.email}</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(req.status)}

                          {/* Action buttons for team members and managers */}
                          {(user?.role === "team_member" || user?.role === "manager") && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateStatus(req.id, "approved")}
                                disabled={req.status === "completed" || req.status === "approved"}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm btn-hover text-xs px-3"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateStatus(req.id, "rejected")}
                                disabled={req.status === "completed" || req.status === "rejected"}
                                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-sm btn-hover text-xs px-3"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/70 hover:bg-white/90 border-gray-200 rounded-xl btn-hover"
                              >
                                <Eye className="h-3 w-3 mr-1.5" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">
                                  {req.productName || "Requisition Details"}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600">
                                  Complete requisition information and details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Submitter Email</Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">{req.email}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                                    <div className="pt-1">{getStatusBadge(req.status)}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Type</Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">{req.type}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Assigned Team</Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                                      {req.assignedTeam}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Details</Label>
                                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-xl leading-relaxed">
                                    {req.details}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">POC Name</Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">{req.pocName}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">POC Email</Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">{req.pocEmail}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Estimated Start Date</Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                                      {req.estimatedStartDate}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">
                                      Expected Delivery Date
                                    </Label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                                      {req.expectedDeliveryDate}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Delivery Timeline</Label>
                                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                                    {req.deliveryTimeline}
                                  </p>
                                </div>
                                {req.requisitionBreakdown && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Requisition Breakdown</Label>
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                      <a
                                        href={req.requisitionBreakdown}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      >
                                        📄 View Document
                                      </a>
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Submitted On</Label>
                                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                                    {req.timestamp ? new Date(req.timestamp).toLocaleString() : "Unknown"}
                                  </p>
                                </div>
                                {(user?.role === "team_member" || user?.role === "manager") && (
                                  <div className="flex space-x-3 pt-6 border-t border-gray-200">
                                    <Button
                                      onClick={() => updateStatus(req.id, "approved")}
                                      disabled={req.status === "completed" || req.status === "approved"}
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-medium btn-hover"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Approve Request
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => updateStatus(req.id, "completed")}
                                      disabled={req.status !== "approved"}
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50 btn-hover"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => updateStatus(req.id, "rejected")}
                                      disabled={req.status === "completed" || req.status === "rejected"}
                                      className="border-red-200 text-red-700 hover:bg-red-50 btn-hover"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject Request
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
          <TabsContent value="requisitions" className="space-y-8">
            <Card className="shadow-medium border-0 bg-white/80 backdrop-blur-sm animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2.5 rounded-xl mr-3 shadow-sm">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  {viewMode === "public"
                    ? "All Requisitions"
                    : user?.role === "submitter"
                      ? "My Requisitions"
                      : "All Requisitions"}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Showing {filteredRequisitions.length} of {requisitions.length} requisitions
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequisitions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No requisitions found</h3>
                    <p className="text-gray-600">
                      {requisitions.length === 0
                        ? "No data found in your Google Sheet."
                        : "No requisitions match your current filters."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100">
                          <TableHead className="font-semibold text-gray-700 py-4">Product/Course</TableHead>
                          <TableHead className="font-semibold text-gray-700">Type</TableHead>
                          <TableHead className="font-semibold text-gray-700">Submitter</TableHead>
                          <TableHead className="font-semibold text-gray-700">Team</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Submitted</TableHead>
                          {(user?.role === "team_member" || user?.role === "manager") && (
                            <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequisitions.map((req, index) => (
                          <TableRow
                            key={req.id}
                            className="hover:bg-blue-50/50 transition-colors duration-200 animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell className="font-medium text-gray-900 py-4">
                              {req.productName || "Untitled"}
                            </TableCell>
                            <TableCell className="text-gray-700">{req.type}</TableCell>
                            <TableCell className="text-gray-700">{req.email}</TableCell>
                            <TableCell className="text-gray-700">{req.assignedTeam}</TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-gray-700">
                              {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"}
                            </TableCell>
                            {(user?.role === "team_member" || user?.role === "manager") && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(req.id, "approved")}
                                    disabled={req.status === "completed" || req.status === "approved"}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs px-3 py-1 btn-hover"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(req.id, "rejected")}
                                    disabled={req.status === "completed" || req.status === "rejected"}
                                    className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xs px-3 py-1 btn-hover"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {viewMode === "authenticated" && user?.role === "manager" && (
            <TabsContent value="teams" className="space-y-8">
              <div className="animate-slide-up">
                <TeamManagement />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
