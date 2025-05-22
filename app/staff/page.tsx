"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Edit, MoreHorizontal, Search, Trash, UserPlus, Clock, X, Check } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth-provider"

// Helper to parse and verify country code and phone number
function parsePhone(phone: string | undefined, validCodes: string[]): { code: string; number: string; valid: boolean } {
  if (!phone) return { code: "+212", number: "", valid: true }
  const match = phone.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match && validCodes.includes(match[1])) {
    return { code: match[1], number: match[2], valid: true }
  }
  // fallback: treat as Morocco if not matched or code is not valid
  // Remove any leading valid country code from the number
  let number = phone
  for (const code of validCodes) {
    if (number.startsWith(code)) {
      number = number.slice(code.length).trim()
      break
    }
  }
  return { code: "+212", number, valid: validCodes.includes("+212") }
}

export default function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { isLoading } = useAuth()
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [countryCode, setCountryCode] = useState("+212")
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [role, setRole] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")

  const allCountryCodes = [
    { code: "+212", label: "+212 (Morocco)" },
    { code: "+1", label: "+1 (US)" },
    { code: "+44", label: "+44 (UK)" },
    { code: "+61", label: "+61 (AUS)" },
    { code: "+49", label: "+49 (DE)" },
    { code: "+33", label: "+33 (FR)" },
    { code: "+34", label: "+34 (ES)" },
    { code: "+39", label: "+39 (IT)" },
    { code: "+91", label: "+91 (IN)" },
  ]
  const validCodes = allCountryCodes.map(c => c.code)

  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true)
      // Fetch staff users from API
      const res = await fetch("/api/staff")
      const staffData = await res.json()
      if (Array.isArray(staffData)) {
        // Map team assignment
        const staffWithTeams = staffData.map((staff: any) => {
          let teamName = "-"
          if (staff.team_members && staff.team_members.length > 0 && staff.team_members[0].team) {
            teamName = staff.team_members[0].team.name
          }
          return {
            ...staff,
            status: "Active",
            teamAssignment: teamName,
          }
        })
        setStaffMembers(staffWithTeams)
      }
      setLoadingStaff(false)
    }
    fetchStaff()

    // Fetch teams for the modal from API
    const fetchTeams = async () => {
      const res = await fetch("/api/teams")
      const result = await res.json()
      if (result.teams) setTeams(result.teams.map((t: any) => ({ id: t.id, name: t.name })))
    }
    fetchTeams()
  }, [])

  if (isLoading || loadingStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      (staff.name?.toLowerCase?.().includes(searchQuery.toLowerCase()) || "") ||
      (staff.email?.toLowerCase?.().includes(searchQuery.toLowerCase()) || "") ||
      (staff.role?.toLowerCase?.().includes(searchQuery.toLowerCase()) || "")

    if (activeTab === "all") return matchesSearch
    if (activeTab === "cleaner") return matchesSearch && staff.role === "Cleaner"
    if (activeTab === "supervisor") return matchesSearch && staff.role === "Supervisor"
    if (activeTab === "inactive") return matchesSearch && staff.status === "Inactive"

    return matchesSearch
  })

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Supervisor":
        return "bg-primary/10 text-primary border-primary/20"
      case "Cleaner":
        return "bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "On Leave":
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      case "Inactive":
        return <X className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  const handleAddStaff = () => {
    setIsEditing(false)
    setSelectedStaff(null)
    setRole("")
    setSelectedTeam("")
    setIsAddStaffModalOpen(true)
  }

  const handleEditStaff = (staff: any) => {
    setSelectedStaff(staff)
    setRole(staff?.role?.toLowerCase() || "")
    setSelectedTeam(
      staff?.team_members && staff.team_members[0]?.team_id
        ? staff.team_members[0].team_id
        : ""
    )
    setIsEditing(true)
    setIsAddStaffModalOpen(true)
  }

  const handleDeleteStaff = (staff: any) => {
    setSelectedStaff(staff)
    setIsDeleteModalOpen(true)
  }

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    // Accepts numbers, spaces, dashes, parentheses, must be at least 7 digits
    return /^\d{7,15}$/.test(phone.replace(/[^\d]/g, ""))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setPhoneError("")
    setFormError("")
    setFormLoading(true)
    const form = e.target as HTMLFormElement
    const first_name = (form.elements.namedItem("first_name") as HTMLInputElement)?.value.trim()
    const last_name = (form.elements.namedItem("last_name") as HTMLInputElement)?.value.trim()
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value.trim()
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim()
    const fullPhone = `${countryCode} ${phone}`
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.")
      setFormLoading(false)
      return
    }
    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (7-15 digits, numbers only).")
      if (phoneInputRef.current) phoneInputRef.current.focus()
      setFormLoading(false)
      return
    }
    // Prepare payload
    const payload: any = {
      first_name,
      last_name,
      email,
      phone: fullPhone,
      role,
      staff: true,
      team_id: selectedTeam || undefined,
    }
    let userId = selectedStaff?.id
    try {
      if (isEditing && userId) {
        // PATCH to staff API endpoint
        const res = await fetch(`/api/staff/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: userId }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to update staff')
      } else {
        // POST to staff API endpoint
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const result = await res.json()
        userId = result?.id
        if (!res.ok) throw new Error(result.error || 'Failed to add staff')
        // Assign team if selected
        if (userId && selectedTeam) {
          await fetch('/api/team-members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, team_id: selectedTeam }),
          })
        }
      }
      setIsAddStaffModalOpen(false)
      // Refresh staff list
      setLoadingStaff(true)
      const res = await fetch("/api/staff")
      const staffData = await res.json()
      if (Array.isArray(staffData)) {
        const staffWithTeams = staffData.map((staff: any) => {
          let teamName = "-"
          if (staff.team_members && staff.team_members.length > 0 && staff.team_members[0].team) {
            teamName = staff.team_members[0].team.name
          }
          return {
            ...staff,
            status: "Active",
            teamAssignment: teamName,
          }
        })
        setStaffMembers(staffWithTeams)
      }
      setLoadingStaff(false)
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred. Please try again.")
      setFormLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedStaff?.id) return
    setFormLoading(true)
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to delete staff')
      }
      setIsDeleteModalOpen(false)
      // Refresh staff list
      setLoadingStaff(true)
      const res2 = await fetch("/api/staff")
      const staffData = await res2.json()
      if (Array.isArray(staffData)) {
        const staffWithTeams = staffData.map((staff: any) => {
          let teamName = "-"
          if (staff.team_members && staff.team_members.length > 0 && staff.team_members[0].team) {
            teamName = staff.team_members[0].team.name
          }
          return {
            ...staff,
            status: "Active",
            teamAssignment: teamName,
          }
        })
        setStaffMembers(staffWithTeams)
      }
      setLoadingStaff(false)
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred. Please try again.")
      setFormLoading(false)
    }
  }

  const parsedPhone = isEditing ? parsePhone(selectedStaff?.phone, validCodes) : { code: countryCode, number: "", valid: true }
  const countryCodeOptions = validCodes.includes(parsedPhone.code)
    ? allCountryCodes
    : [{ code: parsedPhone.code, label: `${parsedPhone.code} (Original)` }, ...allCountryCodes]

  const validCodesSet = new Set(["+212", "+1", "+44", "+61", "+49", "+33", "+34", "+39", "+91"])

  return (
    <MainLayout title="Staff Management" subtitle="Manage cleaning staff members and assignments">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Staff Members</CardTitle>
            <p className="text-xs text-muted-foreground">Manage cleaning staff and supervisors</p>
          </div>
          <div className="flex items-center gap-3">
            {/* <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search staff..."
                className="w-[250px] rounded-lg bg-muted pl-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div> */}

            <Tabs defaultValue="all" className="w-[400px]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
                  All
                </TabsTrigger>
                <TabsTrigger value="cleaner" onClick={() => setActiveTab("cleaner")}>
                  Cleaners
                </TabsTrigger>
                <TabsTrigger value="driver" onClick={() => setActiveTab("driver")}>
                  Drivers
                </TabsTrigger>
                <TabsTrigger value="supervisor" onClick={() => setActiveTab("supervisor")}>
                  Supervisors
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={handleAddStaff}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Staff Member</TableHead>
                  <TableHead className="text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  {/* <TableHead className="text-muted-foreground">Schedule</TableHead> */}
                  <TableHead className="text-muted-foreground">Team Assignment</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  {/* <TableHead className="text-muted-foreground">Rating</TableHead> */}
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {((staff.first_name || "")[0] || "") + ((staff.last_name || "")[0] || "") || "NA"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{`${staff.first_name || ""} ${staff.last_name || ""}`.trim() || "No Name"}</span>
                          {/* <p className="text-xs text-muted-foreground">Since {staff.startDate}</p> */}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {(() => {
                          const phone = staff.phone || ""
                          const match = phone.match(/^(\+\d{1,4})\s*(.*)$/)
                          if (match && validCodesSet.has(match[1])) {
                            return <span><span className="font-semibold text-primary mr-1">{match[1]}</span>{match[2]}</span>
                          }
                          return phone
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground">{staff.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeClass(staff.role)}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    {/* <TableCell>
                      <p className="text-sm">{staff.schedule}</p>
                    </TableCell> */}
                    <TableCell>
                      <p className="text-sm">{staff.teamAssignment}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          staff.status === "Active"
                            ? "bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20"
                        }
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(staff.status)}
                          {staff.status}
                        </span>
                      </Badge>
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex items-center">
                        <p className="text-sm">{staff.rating}</p>
                        <div className="ml-2 text-yellow-500">★</div>
                      </div>
                    </TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteStaff(staff)}
                            className="text-red-500 focus:text-red-500"
                          >
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

      {/* Add/Edit Staff Modal */}
      <Dialog open={isAddStaffModalOpen} onOpenChange={setIsAddStaffModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update staff information and assignment details."
                : "Enter staff information to add them to the system."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    placeholder="Enter first name"
                    defaultValue={isEditing ? selectedStaff?.first_name : ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    placeholder="Enter last name"
                    defaultValue={isEditing ? selectedStaff?.last_name : ""}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    defaultValue={isEditing ? selectedStaff?.email : ""}
                    required
                    onBlur={e => setEmailError(validateEmail(e.target.value) ? "" : "Please enter a valid email address.")}
                    className={emailError ? "border-red-500" : ""}
                  />
                  {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <Select value={isEditing ? parsedPhone.code : countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-24" id="country-code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodeOptions.map(opt => (
                          <SelectItem key={opt.code} value={opt.code}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      ref={phoneInputRef}
                      placeholder="Enter phone number"
                      defaultValue={isEditing ? parsedPhone.number : ""}
                      required
                      onBlur={e => setPhoneError(validatePhone(e.target.value) ? "" : "Please enter a valid phone number (7-15 digits, numbers only).")}
                      className={phoneError ? "border-red-500" : ""}
                    />
                  </div>
                  {(parsedPhone.valid === false && isEditing) && (
                    <p className="text-xs text-red-500">Country code {parsedPhone.code} is not in the allowed list. Please select a valid code.</p>
                  )}
                  {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Team Assignment</Label>
                  <Select
                    value={selectedTeam}
                    onValueChange={setSelectedTeam}
                  >
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddStaffModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? "Saving..." : isEditing ? "Update Staff" : "Add Staff"}</Button>
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
              This will permanently remove <span className="font-medium">{selectedStaff?.name}</span> from your staff
              list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}

