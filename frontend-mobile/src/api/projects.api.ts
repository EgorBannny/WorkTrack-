import client from './client'
import type { Project } from '../types/project'
import type { Member } from '../types/member'

export const apiGetProjects = (orgId: string) =>
  client.get<Project[]>(`/api/orgs/${orgId}/projects`).then((r) => r.data)

export const apiCreateProject = (orgId: string, name: string, description?: string) =>
  client.post<Project>(`/api/orgs/${orgId}/projects`, { name, description }).then((r) => r.data)

export const apiUpdateProject = (orgId: string, projectId: string, data: { name?: string; description?: string | null }) =>
  client.patch<Project>(`/api/orgs/${orgId}/projects/${projectId}`, data).then((r) => r.data)

export const apiDeleteProject = (orgId: string, projectId: string) =>
  client.delete(`/api/orgs/${orgId}/projects/${projectId}`)

export const apiGetProjectMembers = (orgId: string, projectId: string) =>
  client.get<Member[]>(`/api/orgs/${orgId}/projects/${projectId}/members`).then((r) => r.data)