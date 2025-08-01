"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface TeamMember {
  id: string
  email: string
  name: string
  team: string
  role: string
  isActive: boolean
  createdAt: string
}

export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    team: "",
  })

  const teams = ["Content Development", "Design Team", "Technical Writing", "Quality Assurance"]

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members")
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingMember ? `/api/team-members/${editingMember.id}` : "/api/team-members"
      const method = editingMember ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchTeamMembers()
        setIsModalOpen(false)
        setEditingMember(null)
        setFormData({ name: "", email: "", password: "", team: "" })
      }
    } catch (error) {
      console.error("Error saving team member:", error)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      password: "",
      team: member.team,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this team member?")) {
      try {
        const response = await fetch(`/api/team-members/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          await fetchTeamMembers()
        }
      } catch (error) {
        console.error("Error deleting team member:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", team: "" })
    setEditingMember(null)
    setIsModalOpen(false)
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-1">
            <i className="bi bi-people me-2"></i>
            Team Management
          </h5>
          <p className="text-muted mb-0">Manage team members and their access credentials</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Team Member
        </button>
      </div>
      <div className="card-body">
        {teamMembers.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people text-muted" style={{ fontSize: "4rem" }}></i>
            <h4 className="text-muted mt-3">No team members found</h4>
            <p className="text-muted">Add your first team member above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <span className="badge bg-info">{member.team}</span>
                    </td>
                    <td>
                      <span className={`badge ${member.isActive ? "bg-success" : "bg-secondary"}`}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={() => handleEdit(member)} title="Edit">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(member.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingMember ? "Edit Team Member" : "Add New Team Member"}</h5>
                <button type="button" className="btn-close" onClick={resetForm}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingMember}
                      placeholder={editingMember ? "Leave blank to keep current password" : "Enter password"}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="team" className="form-label">
                      Team
                    </label>
                    <select
                      className="form-select"
                      id="team"
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      required
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingMember ? "Update" : "Create"} Team Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
