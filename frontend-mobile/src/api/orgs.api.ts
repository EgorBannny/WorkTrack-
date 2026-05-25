import client from './client'
import type { OrgWithRole } from '../types/org'

export const apiGetMyOrgs = () =>
  client.get<OrgWithRole[]>('/api/orgs/me').then((r) => r.data)

export const apiCreateOrg = (name: string, description?: string) =>
  client.post<OrgWithRole>('/api/orgs', { name, description }).then((r) => r.data)

export const apiUpdateOrg = (orgId: string, data: { name?: string; description?: string | null }) =>
  client.patch<OrgWithRole>(`/api/orgs/${orgId}`, data).then((r) => r.data)

export const apiDeleteOrg = (orgId: string) =>
  client.delete(`/api/orgs/${orgId}`)