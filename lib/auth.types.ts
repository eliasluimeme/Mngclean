export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  staff: boolean
  admin: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  user: User
  expires: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
}

// Role-based route access
export const roleBasedRoutes = {
  admin: ['/dashboard', '/users', '/staff', '/reports', '/settings'],
  staff: ['/bookings', '/orders', '/invoices'],
} as const

export interface LoginResult {
  success: boolean
  user?: User
  error?: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  checkSession: () => Promise<User | null>
} 