import client from './client'
import type { Member, LeaveRequest } from '../types/member'
import type { OrgRole } from '../types/org'

export const apiGetMembers = (orgId: string) =>
  client.get<Member[]>(`/api/orgs/${orgId}/members`).then((r) => r.data)

export const apiUpdateMember = (
  orgId: string,
  userId: string,
  data: { role?: OrgRole; position?: string | null },
) => client.patch(`/api/orgs/${orgId}/members/${userId}`, data)

export const apiRemoveMember = (orgId: string, userId: string) =>
  client.delete(`/api/orgs/${orgId}/members/${userId}`)

export const apiInviteMember = (
  orgId: string,
  data: { email: string; role: OrgRole; position: string },
) => client.post(`/api/orgs/${orgId}/invite`, data)

export const apiGetLeaveRequests = (orgId: string) =>
  client.get<LeaveRequest[]>(`/api/orgs/${orgId}/members/leave-requests`).then((r) => r.data)

export const apiApproveLeaveRequest = (orgId: string, reqId: string) =>
  client.post(`/api/orgs/${orgId}/members/leave-requests/${reqId}/approve`)

export const apiRejectLeaveRequest = (orgId: string, reqId: string) =>
  client.post(`/api/orgs/${orgId}/members/leave-requests/${reqId}/reject`)