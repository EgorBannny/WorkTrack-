import client from './client'
import type { OrgWithRole } from '@/types/org'

export async function apiGetMyOrgs(): Promise<OrgWithRole[]> {
  const res = await client.get<OrgWithRole[]>('/api/orgs/me')
  return res.data
}

export async function apiCreateOrg(name: string): Promise<OrgWithRole> {
  const res = await client.post<OrgWithRole>('/api/orgs', { name })
  return res.data
}