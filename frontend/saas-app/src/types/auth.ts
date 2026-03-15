export interface User {
  id: string
  phone: string
  name: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
  teamId: string
}

export interface Team {
  id: string
  name: string
  logo?: string
  memberCount: number
  storeCount: number
  plan: 'free' | 'basic' | 'pro'
  createdAt: string
}

export interface TeamMember {
  id: string
  userId: string
  name: string
  phone: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  status: 'active' | 'invited'
}

export interface Store {
  id: string
  name: string
  address: string
  memberCount: number
  createdAt: string
}

export interface LoginForm {
  phone: string
  password: string
}

export interface RegisterForm {
  phone: string
  password: string
  name: string
  teamName: string
}
