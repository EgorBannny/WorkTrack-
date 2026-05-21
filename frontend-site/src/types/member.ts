import type { OrgRole } from './org'

export interface MemberUser {
  id: string
  email: string
  display_name: string
}

export interface Member {
  user_id: string
  org_id: string
  role: OrgRole
  position: string | null
  created_at: string
  user: MemberUser
}

export interface LeaveRequest {
  id: string
  user_id: string
  org_id: string
  created_at: string
}