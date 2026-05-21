import client from './client'
import type { OrgWithRole } from '@/types/org'

export async function apiGetMyOrgs(): Promise<OrgWithRole[]> {
  const res = await client.get<OrgWithRole[]>('/api/orgs/me')
  return res.data
}

export async function apiCreateOrg(name: string, description?: string): Promise<OrgWithRole> {
  const res = await client.post<OrgWithRole>('/api/orgs', { name, description })
  return res.data
}

export async function apiUploadOrgAvatar(orgId: string, blob: Blob): Promise<void> {
  const form = new FormData()
  form.append('file', blob, 'avatar.jpg')
  await client.post(`/api/orgs/${orgId}/avatar`, form)
}

export async function apiUpdateOrg(orgId: string, data: { name?: string; description?: string | null }): Promise<OrgWithRole> {
  const res = await client.patch<OrgWithRole>(`/api/orgs/${orgId}`, data)
  return res.data
}

export async function apiDeleteOrgAvatar(orgId: string): Promise<void> {
  await client.delete(`/api/orgs/${orgId}/avatar`)
}

export async function apiDeleteOrg(orgId: string): Promise<void> {
  await client.delete(`/api/orgs/${orgId}`)
}