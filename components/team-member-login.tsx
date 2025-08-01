"use client"

import type React from "react"
import { useState } from "react"

interface TeamMemberLoginProps {
  onLogin: (user: any) => void
}

export function TeamMemberLogin({ onLogin }: TeamMemberLoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("team-member")

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
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div
                    className="bg-gradient-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i className="bi bi-file-text" style={{ fontSize: "2rem" }}></i>
                  </div>
                  <h2 className="text-gradient mb-2">Requisition System</h2>
                  <p className="text-muted">Sign in to access your dashboard</p>
                </div>

                {/* Navigation Tabs */}
                <ul className="nav nav-pills nav-fill mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "team-member" ? "active" : ""}`}
                      onClick={() => setActiveTab("team-member")}
                    >
                      <i className="bi bi-people me-2"></i>
                      Team Member
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "manager" ? "active" : ""}`}
                      onClick={() => setActiveTab("manager")}
                    >
                      <i className="bi bi-shield-check me-2"></i>
                      Manager
                    </button>
                  </li>
                </ul>

                {/* Team Member Login */}
                {activeTab === "team-member" && (
                  <div>
                    <form onSubmit={handleTeamMemberLogin}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label fw-bold">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          placeholder="your.email@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-bold">
                          Password
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="alert alert-danger" role="alert">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          {error}
                        </div>
                      )}

                      <div className="d-grid">
                        <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Signing in...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-box-arrow-in-right me-2"></i>
                              Sign In
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="alert alert-info mt-4" role="alert">
                      <h6 className="alert-heading">
                        <i className="bi bi-info-circle me-2"></i>
                        Demo Credentials
                      </h6>
                      <hr />
                      <p className="mb-2">
                        <strong>Email:</strong> alice.johnson@company.com
                      </p>
                      <p className="mb-2">
                        <strong>Email:</strong> bob.smith@company.com
                      </p>
                      <p className="mb-2">
                        <strong>Email:</strong> carol.davis@company.com
                      </p>
                      <p className="mb-0">
                        <strong>Password:</strong> password123
                      </p>
                    </div>
                  </div>
                )}

                {/* Manager Login */}
                {activeTab === "manager" && (
                  <div className="text-center">
                    <div className="alert alert-primary" role="alert">
                      <i className="bi bi-shield-check me-2"></i>
                      <strong>Manager Access</strong>
                      <hr />
                      Managers sign in with their Google account for secure access to all features
                    </div>

                    <div className="d-grid">
                      <button className="btn btn-outline-dark btn-lg" onClick={handleGoogleSignIn} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
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
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
