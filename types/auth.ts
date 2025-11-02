export interface AuthUser {
  id: string
  email: string
  firstName: string
  middleName?: string | null
  lastName: string
  fullName: string
  createdAt?: string | null
}
