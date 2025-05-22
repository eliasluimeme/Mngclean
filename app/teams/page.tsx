"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, MoreHorizontal, Edit, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [staffUsers, setStaffUsers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<any>(null)
  const [editTeamName, setEditTeamName] = useState("")
  const [editSelectedMembers, setEditSelectedMembers] = useState<string[]>([])
  const [editFormLoading, setEditFormLoading] = useState(false)
  const [editFormError, setEditFormError] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTeam, setDeleteTeam] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    const res = await fetch("/api/teams")
    const json = await res.json()
    setTeams(json.teams || [])
    setLoading(false)
  }

  const fetchStaffUsers = async () => {
    const res = await fetch("/api/users?staff=true")
    const users = await res.json()
    setStaffUsers((users || []).filter((u: any) => u.staff === true))
  }

  const openAddModal = () => {
    setTeamName("")
    setSelectedMembers([])
    setFormError("")
    setIsAddModalOpen(true)
    fetchStaffUsers()
  }

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormLoading(true)
    // Create team
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName, members: selectedMembers })
    })
    const json = await res.json()
    setFormLoading(false)
    if (!res.ok) {
      setFormError(json.error || "Failed to create team")
      return
    }
    setIsAddModalOpen(false)
    fetchTeams()
  }

  const openEditModal = (team: any) => {
    setEditTeam(team)
    setEditTeamName(team.name)
    setEditSelectedMembers(team.members.map((m: any) => m.id))
    setEditFormError("")
    setIsEditModalOpen(true)
    fetchStaffUsers()
  }

  const handleEditMemberToggle = (userId: string) => {
    setEditSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditFormError("")
    setEditFormLoading(true)
    if (!editTeam) return
    const res = await fetch(`/api/teams/${editTeam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editTeam.id, name: editTeamName, members: editSelectedMembers })
    })
    const json = await res.json()
    setEditFormLoading(false)
    if (!res.ok) {
      setEditFormError(json.error || "Failed to update team")
      return
    }
    setIsEditModalOpen(false)
    fetchTeams()
  }

  const openDeleteModal = (team: any) => {
    setDeleteTeam(team)
    setDeleteError("")
    setIsDeleteModalOpen(true)
  }

  const handleDeleteTeam = async () => {
    if (!deleteTeam) return
    setDeleteLoading(true)
    setDeleteError("")
    const res = await fetch(`/api/teams/${deleteTeam.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTeam.id })
    })
    const json = await res.json()
    setDeleteLoading(false)
    if (!res.ok) {
      setDeleteError(json.error || "Failed to delete team")
      return
    }
    setIsDeleteModalOpen(false)
    fetchTeams()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout title="Teams" subtitle="View all teams and their members">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Teams</CardTitle>
            <p className="text-xs text-muted-foreground">List of all teams in the system</p>
          </div>
          <Button onClick={openAddModal}>
            <Users className="mr-2 h-4 w-4" />
            Add Team
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Team Name</TableHead>
                  <TableHead className="text-muted-foreground">Members</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <span className="font-medium">{team.name}</span>
                    </TableCell>
                    <TableCell>
                      {team.members && team.members.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {team.members.map((member: any) => (
                            <li key={member.id}>
                              {member.first_name} {member.last_name} <span className="text-xs text-muted-foreground">({member.email})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-muted-foreground">No members</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(team)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteModal(team)} className="text-red-500 focus:text-red-500">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Team Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
            <DialogDescription>Enter a team name and select members to add to the team.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTeam} className="space-y-6">
            {formError && (
              <div className="text-xs text-red-500 border border-red-300 bg-red-50 rounded p-2 mb-2">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="team-name" className="block text-sm font-medium">Team Name</label>
              <Input id="team-name" value={teamName} onChange={e => setTeamName(e.target.value)} required disabled={formLoading} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium mb-1">Select Members</div>
              <div className="max-h-48 overflow-y-auto border rounded p-2">
                {staffUsers.length === 0 && <div className="text-xs text-muted-foreground">No staff found.</div>}
                {staffUsers.map((user: any) => (
                  <label key={user.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox checked={selectedMembers.includes(user.id)} onCheckedChange={() => handleMemberToggle(user.id)} disabled={formLoading} />
                    <span>{user.first_name} {user.last_name} <span className="text-xs text-muted-foreground">({user.email})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={formLoading}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? "Saving..." : "Add Team"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team name and members.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeam} className="space-y-6">
            {editFormError && (
              <div className="text-xs text-red-500 border border-red-300 bg-red-50 rounded p-2 mb-2">
                {editFormError}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="edit-team-name" className="block text-sm font-medium">Team Name</label>
              <Input id="edit-team-name" value={editTeamName} onChange={e => setEditTeamName(e.target.value)} required disabled={editFormLoading} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium mb-1">Select Members</div>
              <div className="max-h-48 overflow-y-auto border rounded p-2">
                {staffUsers.length === 0 && <div className="text-xs text-muted-foreground">No staff found.</div>}
                {staffUsers.map((user: any) => (
                  <label key={user.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox checked={editSelectedMembers.includes(user.id)} onCheckedChange={() => handleEditMemberToggle(user.id)} disabled={editFormLoading} />
                    <span>{user.first_name} {user.last_name} <span className="text-xs text-muted-foreground">({user.email})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={editFormLoading}>Cancel</Button>
              <Button type="submit" disabled={editFormLoading}>{editFormLoading ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium">{deleteTeam?.name}</span> and all its member assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <div className="text-xs text-red-500 border border-red-300 bg-red-50 rounded p-2 mb-2">{deleteError}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
} 