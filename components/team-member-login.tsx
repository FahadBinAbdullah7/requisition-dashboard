"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Eye, EyeOff, LogIn, Users, Shield } from "lucide-react"

interface TeamMemberLoginProps {
  onLogin: (user: any) => void
}

export function TeamMemberLogin({ onLogin }: TeamMemberLoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleTeamMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/team-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        onLogin(data.user)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/callback`
    const scope = "openid email profile https://www.googleapis.com/auth/spreadsheets"

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`

    window.location.href = authUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="shadow-strong border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-medium">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Requisition Dashboard
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sign in to access your dashboard and manage requisitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="team-member" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-xl mb-8">
                <TabsTrigger
                  value="team-member"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-medium flex items-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Member
                </TabsTrigger>
                <TabsTrigger
                  value="manager"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-medium flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manager
                </TabsTrigger>
              </TabsList>

              <TabsContent value="team-member" className="space-y-6">
                <form onSubmit={handleTeamMemberLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-medium btn-hover"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </div>
                    )}
                  </Button>
                </form>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Demo Credentials:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• alice.johnson@company.com</p>
                    <p>• bob.smith@company.com</p>
                    <p>• carol.davis@company.com</p>
                    <p className="font-medium mt-2">Password: password123</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manager" className="space-y-6">
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-blue-800 font-medium">
                      Managers sign in with their Google account for secure access to all features
                    </p>
                  </div>
                  <Button
                    className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-semibold rounded-xl shadow-sm btn-hover"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </div>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
