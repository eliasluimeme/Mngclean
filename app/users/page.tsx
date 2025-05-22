"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Edit,
  MoreHorizontal,
  Search,
  Trash,
  UserPlus,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  MessageCircle,
  ClipboardIcon,
} from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  TableBody as UITableBody,
  TableHead as UITableHead,
  TableHeader as UITableHeader,
  TableRow as UITableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { useAuth } from "@/components/auth-provider"
import { Table, TableRow, TableCell } from "@/components/ui/table"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { isLoading } = useAuth()
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [newOrderDate, setNewOrderDate] = useState<Date | undefined>(new Date())
  const [newOrderTime, setNewOrderTime] = useState("09:00 AM - 11:00 AM")
  const [activeAddUserStep, setActiveAddUserStep] = useState(1)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const initialNewUserState = { first_name: '', last_name: '', email: '', phone: '' };
  const [newUser, setNewUser] = useState({ ...initialNewUserState });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState(false);
  const [addUserFormErrors, setAddUserFormErrors] = useState<{ [key: string]: string }>({});
  const [countryCode, setCountryCode] = useState('+212');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      setFetchError(null)
      try {
        const res = await fetch('/api/users')
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data)
      } catch (err: any) {
        setFetchError(err.message)
        setUsers([])
      }
      setLoadingUsers(false)
    }
    fetchUsers()
  }, [])

  if (isLoading || loadingUsers) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive">Error loading users: {fetchError}</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter((user) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || '').includes(searchQuery)

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && user.status === "Active"
    if (activeTab === "inactive") return matchesSearch && user.status === "Inactive"

    return matchesSearch
  })

  const handleUserClick = (user: any) => {
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleEditUser = () => {
    setIsUserModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission logic here
    setIsEditModalOpen(false)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "Pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "Canceled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return ""
    }
  }

  async function handleAddUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddUserError(null);
    setAddUserSuccess(false);
    const errors: { [key: string]: string } = {};
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newUser.first_name) errors.first_name = 'First name is required.';
    if (!newUser.last_name) errors.last_name = 'Last name is required.';
    if (!newUser.email) errors.email = 'Email is required.';
    else if (!emailRegex.test(newUser.email)) errors.email = 'Invalid email format.';
    if (!newUser.phone) errors.phone = 'Phone is required.';
    // Phone validation based on country code
    if (countryCode === '+212') {
      // Morocco: 9 digits, starts with 6, 7, or 8
      const phoneRegex = /^(6|7|8)\d{8}$/;
      if (!phoneRegex.test(newUser.phone)) {
        errors.phone = 'Moroccan phone must be 9 digits and start with 6, 7, or 8.';
      }
    }
    // Add more country code validations here if needed
    setAddUserFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setAddUserLoading(true);
    try {
      const formattedPhone = `${countryCode}${newUser.phone}`;
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, phone: formattedPhone }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        // Check for duplicate email/phone errors
        if (errorData.error) {
          if (errorData.error.toLowerCase().includes('duplicate') && errorData.error.toLowerCase().includes('email')) {
            setAddUserFormErrors((prev) => ({ ...prev, email: 'Email already in use.' }));
          } else if (errorData.error.toLowerCase().includes('duplicate') && errorData.error.toLowerCase().includes('phone')) {
            setAddUserFormErrors((prev) => ({ ...prev, phone: 'Phone number already in use.' }));
          } else {
            setAddUserError(errorData.error);
          }
        } else {
          setAddUserError('Failed to add user');
        }
        setAddUserLoading(false);
        return;
      }
      setAddUserSuccess(true);
      setNewUser({ ...initialNewUserState });
      setCountryCode('+212');
      setIsAddUserModalOpen(false);
      // Refresh users
      setLoadingUsers(true);
      const refetch = await fetch('/api/users');
      const data = await refetch.json();
      setUsers(data);
      setLoadingUsers(false);
    } catch (err: any) {
      setAddUserError(err.message || 'Failed to add user');
    }
    setAddUserLoading(false);
  }

  return (
    <MainLayout title="Users" subtitle="Manage your service users and customer accounts">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <p className="text-xs text-muted-foreground">Manage users</p>
          </div>
          <Button onClick={() => setIsAddUserModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-border">
            <Table>
              <UITableHeader className="bg-muted/50">
                <UITableRow className="hover:bg-transparent">
                  <UITableHead className="text-muted-foreground">User</UITableHead>
                  <UITableHead className="text-muted-foreground">Contact</UITableHead>
                  <UITableHead className="text-muted-foreground">Status</UITableHead>
                  {/* <UITableHead className="text-muted-foreground">Upcoming Order</UITableHead>
                  <UITableHead className="text-muted-foreground">Last Order</UITableHead> */}
                  <UITableHead className="text-muted-foreground text-right">Actions</UITableHead>
                </UITableRow>
              </UITableHeader>
              <UITableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.first_name} {user.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">{user.email}</span>
                        <span className="text-xs text-muted-foreground">{user.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20">
                        Active
                      </Badge>
                    </TableCell>
                    {/* <TableCell>-</TableCell>
                    <TableCell>-</TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUserClick(user)
                            }}
                          >
                            <Search className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUser(user)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem> */}
                          {/* <DropdownMenuSeparator /> */}
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </UITableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] w-[95vw] overflow-y-auto p-0 rounded-2xl shadow-xl">
          {/* Header with gradient */}
          <div className="flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-b from-primary/10 to-background rounded-t-2xl">
            <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20 shadow-lg">
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {selectedUser ? `${selectedUser.first_name?.[0] || ''}${selectedUser.last_name?.[0] || ''}`.toUpperCase() : ''}
                  </AvatarFallback>
                </Avatar>
            <h2 className="text-2xl font-bold text-center mb-1 text-foreground">{selectedUser?.first_name} {selectedUser?.last_name}</h2>
            <p className="text-sm text-muted-foreground text-center">User Profile</p>
                  </div>
          <div className="px-6 pb-8 pt-4 bg-background rounded-b-2xl">
            <div className="mb-4 border-b border-border pb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wider">Contact Information</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium break-all">{selectedUser?.email || <span className='text-muted-foreground'>No email</span>}</span>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedUser?.phone || <span className='text-muted-foreground'>No phone</span>}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                className="w-full transition-colors hover:bg-green-50 focus:bg-green-100"
                onClick={() => window.open(`https://wa.me/${selectedUser?.phone?.replace(/\D/g, "") || "15551234567"}`, "_blank")}
              >
                <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full transition-colors hover:bg-primary/10 focus:bg-primary/20"
                onClick={() => window.open(`mailto:${selectedUser?.email}`, "_blank")}
              >
                <Mail className="mr-2 h-4 w-4 text-primary" />
                Email
              </Button>
              <Button
                variant="outline"
                className="w-full transition-colors hover:bg-blue-50 focus:bg-blue-100"
                onClick={() => window.open(`tel:${selectedUser?.phone}`, "_blank")}
              >
                <Phone className="mr-2 h-4 w-4 text-blue-500" />
                Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter the details for the new user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                <Input
                  id="first_name"
                  value={newUser.first_name}
                  onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                  placeholder="John"
                  required
                />
                {addUserFormErrors.first_name && <div className="text-xs text-red-500">{addUserFormErrors.first_name}</div>}
              </div>
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                <Input
                  id="last_name"
                  value={newUser.last_name}
                  onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                  placeholder="Smith"
                  required
                />
                {addUserFormErrors.last_name && <div className="text-xs text-red-500">{addUserFormErrors.last_name}</div>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
                {addUserFormErrors.email && <div className="text-xs text-red-500">{addUserFormErrors.email}</div>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select
                    className="rounded-md border border-input bg-background px-2 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                  >
                    <option value="+212">🇲🇦 +212</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+1">🇺🇸 +1</option>
                    {/* Add more country codes as needed */}
                  </select>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder={countryCode === '+212' ? '646598214' : 'Phone number'}
                    required
                    className="w-full"
                  />
                </div>
                {addUserFormErrors.phone && <div className="text-xs text-red-500">{addUserFormErrors.phone}</div>}
              </div>
            </div>
            {addUserError && <div className="text-xs text-red-500">{addUserError}</div>}
            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => setIsAddUserModalOpen(false)} disabled={addUserLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={addUserLoading}>
                {addUserLoading ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

