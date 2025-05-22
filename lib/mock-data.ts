import { User } from './auth.types'

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@mng.com',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'staff@mng.com',
    name: 'Staff User',
    role: 'staff'
  }
]

export const mockPasswords: Record<string, string> = {
  'admin@mng.com': 'admin123',
  'staff@mng.com': 'staff123'
} 