import type { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  fullName: string
  phone: string
  organization: string
  role: string
  country?: string
  emailAlerts?: boolean
  email: string
  authProvider: 'password' | 'google.com'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface SignUpData extends Omit<UserProfile, 'authProvider' | 'createdAt' | 'updatedAt'> {
  password: string
}
