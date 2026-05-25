import type { OrgRole } from './org'

export interface Member {
  user_id: string
  role: OrgRole
  position: string | null
  user: {
    id: string
    display_name: string
    email: string
  }
}

export interface LeaveRequest {
  id: string
  user_id: string
}