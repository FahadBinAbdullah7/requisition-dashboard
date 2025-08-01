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
  Activity,
  Zap,
  Target,
  Award,
  RefreshCw,
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

    const statusConfig = {
      pending: {
        className: "status-pending",
        icon: <Clock className="w-3 h-3 mr-1.5" />,
        label: "Pending",
      },
      approved: {
        className: "status-approved",
        icon: <CheckCircle className="w-3 h-3 mr-1.5" />,
        label: "Approved",
      },
      completed: {
        className: "status-completed",
        icon: <CheckCircle className="w-3 h-3 mr-1.5" />,
        label: "Completed",
      },
      rejected: {
        className: "status-rejected",
        icon: <XCircle className="w-3 h-3 mr-1.5" />,
        label: "Rejected",
      },
    }

    const config = statusConfig[statusLower as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge className={`${config.className} font-semibold px-3 py-1.5 text-xs rounded-full border-0`}>
        {config.icon}
        {config.label}
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

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await updateStatus(id, newStatus)
    // Force a refetch to ensure public view sees the update
    setTimeout(() => {
      refetch()
    }, 1000)
  }

  if (showLogin) {
    return <TeamMemberLogin onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center p-8">
        <Card className="glass-card w-full max-w-md border-0 rounded-3xl animate-bounce-in">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="loading-spinner mb-8"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Dashboard</h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Connecting to Google Sheets and fetching your requisitions...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container flex items-center justify-center p-8">
        <Card className="glass-card w-full max-w-lg border-0 rounded-3xl animate-scale-in">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Connection Error</CardTitle>
            <CardDescription className="text-gray-600 text-lg">Unable to connect to Google Sheets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <div className="space-y-4">
              <Button
                className="w-full btn-primary h-12 rounded-2xl font-semibold"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Retry Connection
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="glass-card border-2 h-12 rounded-2xl font-medium bg-transparent"
                  onClick={() => window.open("/api/test-connection", "_blank")}
                >
                  Test API
                </Button>
                <Button
                  variant="outline"
                  className="glass-card border-2 h-12 rounded-2xl font-medium bg-transparent"
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
    <div className="dashboard-container min-h-screen">
      {/* Professional Header */}
      <header className="professional-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center animate-fade-in">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Requisition Dashboard
                </h1>
                <p className="text-gray-600 font-medium mt-1">
                  {viewMode === "public" ? "🌐 Public View - All Requisitions" : "🔐 Authenticated Dashboard"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 animate-fade-in">
              {viewMode === "public" ? (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setShowLogin(true)}
                    className="btn-primary h-12 px-6 rounded-2xl font-semibold"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Team Login
                  </Button>
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-2 rounded-full font-semibold">
                    <Eye className="h-4 w-4 mr-2" />
                    Public Access
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-600 capitalize font-medium">
                      {user?.role?.replace("_", " ")} • {user?.team || "All Teams"}
                    </p>
                  </div>
                  <Avatar className="h-14 w-14 ring-4 ring-blue-100 shadow-lg">
                    <AvatarImage src={user?.picture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg">
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
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl h-10 w-10"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        {/* Filters Section */}
        <Card className="filters-section mb-8 border-0 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-800">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              Smart Filters & Search
            </CardTitle>
            <CardDescription className="text-gray-600 font-medium">
              Filter and search through requisitions with advanced options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-3">
                <Label htmlFor="dateFrom" className="text-sm font-bold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="professional-input h-12 font-medium"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="dateTo" className="text-sm font-bold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="professional-input h-12 font-medium"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                  Status Filter
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="professional-input h-12 font-medium">
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
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  Team Filter
                </Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="professional-input h-12 font-medium">
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
                  className="w-full glass-card border-2 h-12 rounded-2xl font-semibold hover:bg-white/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-8">
          {viewMode === "authenticated" && user?.role === "manager" ? (
            <TabsList className="professional-tabs grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="professional-tab h-12 font-semibold">
                <Activity className="w-5 h-5 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="requisitions" className="professional-tab h-12 font-semibold">
                <FileText className="w-5 h-5 mr-2" />
                All Requisitions
              </TabsTrigger>
              <TabsTrigger value="teams" className="professional-tab h-12 font-semibold">
                <Users className="w-5 h-5 mr-2" />
                Team Management
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="professional-tabs grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="professional-tab h-12 font-semibold">
                <Activity className="w-5 h-5 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="requisitions" className="professional-tab h-12 font-semibold">
                <FileText className="w-5 h-5 mr-2" />
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
                  icon: Target,
                  gradient: "from-blue-500 to-indigo-600",
                  description: dateFrom || dateTo ? "In selected range" : "All time",
                  change: "+12%",
                },
                {
                  title: "Pending Review",
                  value: stats.pending,
                  icon: Clock,
                  gradient: "from-amber-500 to-orange-500",
                  description: `${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total`,
                  change: "-5%",
                },
                {
                  title: "Approved",
                  value: stats.approved,
                  icon: CheckCircle,
                  gradient: "from-blue-500 to-cyan-500",
                  description: `${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total`,
                  change: "+8%",
                },
                {
                  title: "Completed",
                  value: stats.completed,
                  icon: Award,
                  gradient: "from-emerald-500 to-green-600",
                  description: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total`,
                  change: "+15%",
                },
                {
                  title: "Rejected",
                  value: stats.rejected,
                  icon: XCircle,
                  gradient: "from-red-500 to-rose-600",
                  description: `${stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% of total`,
                  change: "-3%",
                },
              ].map((stat, index) => (
                <Card
                  key={stat.title}
                  className="stats-card border-0 rounded-3xl animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                    <p className="text-xs text-gray-600 font-medium mb-2">{stat.description}</p>
                    <div className="flex items-center">
                      <Zap className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs font-semibold text-green-600">{stat.change}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Requisitions */}
            <Card className="glass-card border-0 rounded-3xl animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Recent Requisitions
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium text-lg">
                  {viewMode === "public"
                    ? "Latest requisition requests from all teams"
                    : user?.role === "submitter"
                      ? "Your recent submissions and their status"
                      : "Latest requisition requests across all teams"}
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequisitions.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Search className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No requisitions found</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                      {requisitions.length === 0
                        ? "No data found in your Google Sheet. Make sure your sheet has data and is properly configured."
                        : "No requisitions match your current filters. Try adjusting your search criteria."}
                    </p>
                    {requisitions.length === 0 && (
                      <div className="flex justify-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => window.open("/api/test-connection", "_blank")}
                          className="glass-card border-2 h-12 px-6 rounded-2xl font-semibold"
                        >
                          Test Connection
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open("/api/debug-columns", "_blank")}
                          className="glass-card border-2 h-12 px-6 rounded-2xl font-semibold"
                        >
                          Debug Sheet
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredRequisitions.slice(0, 10).map((req, index) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-8 glass-card border-0 rounded-3xl hover:shadow-xl transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-xl mb-3">
                            {req.productName || "Untitled Request"}
                          </h4>
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 font-semibold px-3 py-1 rounded-full">
                              {req.type}
                            </Badge>
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 font-semibold px-3 py-1 rounded-full">
                              {req.assignedTeam}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            Submitted: {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"} by{" "}
                            <span className="font-bold text-gray-800">{req.email}</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-6">
                          {getStatusBadge(req.status)}

                          {/* Action buttons for team members and managers */}
                          {(user?.role === "team_member" || user?.role === "manager") && (
                            <div className="flex space-x-3">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(req.id, "approved")}
                                disabled={req.status === "completed" || req.status === "approved"}
                                className="btn-success h-10 px-4 rounded-2xl font-semibold"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(req.id, "rejected")}
                                disabled={req.status === "completed" || req.status === "rejected"}
                                className="btn-danger h-10 px-4 rounded-2xl font-semibold"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="glass-card border-2 h-10 px-4 rounded-2xl font-semibold hover:bg-white/90 bg-transparent"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto glass-card border-0 rounded-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-3xl font-bold text-gray-900">
                                  {req.productName || "Requisition Details"}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 text-lg font-medium">
                                  Complete requisition information and management actions
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-8 py-8">
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Submitter Email
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.email}
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Current Status
                                    </Label>
                                    <div className="pt-2">{getStatusBadge(req.status)}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Request Type
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.type}
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Assigned Team
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.assignedTeam}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Request Details
                                  </Label>
                                  <p className="text-gray-900 glass-card p-6 rounded-2xl border-0 leading-relaxed text-lg">
                                    {req.details}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      POC Name
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.pocName}
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      POC Email
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.pocEmail}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Estimated Start Date
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.estimatedStartDate}
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Expected Delivery Date
                                    </Label>
                                    <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                      {req.expectedDeliveryDate}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Delivery Timeline
                                  </Label>
                                  <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                    {req.deliveryTimeline}
                                  </p>
                                </div>
                                {req.requisitionBreakdown && (
                                  <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Requisition Breakdown
                                    </Label>
                                    <div className="glass-card p-4 rounded-2xl border-0">
                                      <a
                                        href={req.requisitionBreakdown}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-lg flex items-center"
                                      >
                                        <FileText className="w-5 h-5 mr-2" />
                                        View Document
                                      </a>
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-3">
                                  <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Submission Date
                                  </Label>
                                  <p className="text-lg font-semibold text-gray-900 glass-card p-4 rounded-2xl border-0">
                                    {req.timestamp ? new Date(req.timestamp).toLocaleString() : "Unknown"}
                                  </p>
                                </div>
                                {(user?.role === "team_member" || user?.role === "manager") && (
                                  <div className="flex space-x-4 pt-8 border-t-2 border-gray-200">
                                    <Button
                                      onClick={() => handleStatusUpdate(req.id, "approved")}
                                      disabled={req.status === "completed" || req.status === "approved"}
                                      className="btn-success h-12 px-6 rounded-2xl font-bold"
                                    >
                                      <UserCheck className="h-5 w-5 mr-2" />
                                      Approve Request
                                    </Button>
                                    <Button
                                      onClick={() => handleStatusUpdate(req.id, "completed")}
                                      disabled={req.status !== "approved"}
                                      className="btn-primary h-12 px-6 rounded-2xl font-bold"
                                    >
                                      <CheckCircle className="h-5 w-5 mr-2" />
                                      Mark Complete
                                    </Button>
                                    <Button
                                      onClick={() => handleStatusUpdate(req.id, "rejected")}
                                      disabled={req.status === "completed" || req.status === "rejected"}
                                      className="btn-danger h-12 px-6 rounded-2xl font-bold"
                                    >
                                      <XCircle className="h-5 w-5 mr-2" />
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
            <Card className="glass-card border-0 rounded-3xl animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  {viewMode === "public"
                    ? "All Requisitions"
                    : user?.role === "submitter"
                      ? "My Requisitions"
                      : "All Requisitions"}
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium text-lg">
                  Showing {filteredRequisitions.length} of {requisitions.length} requisitions
                  {(dateFrom || dateTo) && " (filtered by date range)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequisitions.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Search className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No requisitions found</h3>
                    <p className="text-gray-600 text-lg">
                      {requisitions.length === 0
                        ? "No data found in your Google Sheet."
                        : "No requisitions match your current filters."}
                    </p>
                  </div>
                ) : (
                  <div className="professional-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-gray-700 py-6 text-base">Product/Course</TableHead>
                          <TableHead className="font-bold text-gray-700 text-base">Type</TableHead>
                          <TableHead className="font-bold text-gray-700 text-base">Submitter</TableHead>
                          <TableHead className="font-bold text-gray-700 text-base">Team</TableHead>
                          <TableHead className="font-bold text-gray-700 text-base">Status</TableHead>
                          <TableHead className="font-bold text-gray-700 text-base">Submitted</TableHead>
                          {(user?.role === "team_member" || user?.role === "manager") && (
                            <TableHead className="font-bold text-gray-700 text-base">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequisitions.map((req, index) => (
                          <TableRow
                            key={req.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell className="font-bold text-gray-900 py-6 text-base">
                              {req.productName || "Untitled"}
                            </TableCell>
                            <TableCell className="text-gray-700 font-medium">{req.type}</TableCell>
                            <TableCell className="text-gray-700 font-medium">{req.email}</TableCell>
                            <TableCell className="text-gray-700 font-medium">{req.assignedTeam}</TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-gray-700 font-medium">
                              {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : "Unknown"}
                            </TableCell>
                            {(user?.role === "team_member" || user?.role === "manager") && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusUpdate(req.id, "approved")}
                                    disabled={req.status === "completed" || req.status === "approved"}
                                    className="btn-success h-8 px-3 rounded-xl text-xs font-semibold"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusUpdate(req.id, "rejected")}
                                    disabled={req.status === "completed" || req.status === "rejected"}
                                    className="btn-danger h-8 px-3 rounded-xl text-xs font-semibold"
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
