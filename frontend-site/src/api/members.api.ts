import client from './client'
import type { Member, LeaveRequest } from '@/types/member'
import type { OrgRole } from '@/types/org'

export async function apiGetMembers(orgId: string): Promise<Member[]> {
  const res = await client.get<Member[]>(`/api/orgs/${orgId}/members`)
  return res.data
}

export async function apiUpdateMember(
  orgId: string,
  userId: string,
  data: { role?: OrgRole; position?: string | null },
): Promise<Member> {
  const res = await client.patch<Member>(`/api/orgs/${orgId}/members/${userId}`, data)
  return res.data
}

export async function apiRemoveMember(orgId: string, userId: string): Promise<void> {
  await client.delete(`/api/orgs/${orgId}/members/${userId}`)
}

export async function apiInviteMember(
  orgId: string,
  data: { email: string; role: OrgRole; position: string },
): Promise<{ token: string }> {
  const res = await client.post<{ token: string }>(`/api/orgs/${orgId}/invite`, data)
  return res.data
}

export async function apiGetLeaveRequests(orgId: string): Promise<LeaveRequest[]> {
  const res = await client.get<LeaveRequest[]>(`/api/orgs/${orgId}/leave-requests`)
  return res.data
}

export async function apiApproveLeaveRequest(orgId: string, requestId: string): Promise<void> {
  await client.post(`/api/orgs/${orgId}/leave-requests/${requestId}/approve`)
}

export async function apiRejectLeaveRequest(orgId: string, requestId: string): Promise<void> {
  await client.post(`/api/orgs/${orgId}/leave-requests/${requestId}/reject`)
}