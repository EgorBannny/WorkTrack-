import client from './client'
import type { Project, ProjectMember } from '@/types/project'

export async function apiGetProjects(orgId: string): Promise<Project[]> {
  const res = await client.get<Project[]>(`/api/orgs/${orgId}/projects`)
  return res.data
}

export async function apiCreateProject(
  orgId: string,
  name: string,
  description?: string,
): Promise<Project> {
  const res = await client.post<Project>(`/api/orgs/${orgId}/projects`, { name, description })
  return res.data
}

export async function apiUpdateProject(
  orgId: string,
  projectId: string,
  data: { name?: string; description?: string | null },
): Promise<Project> {
  const res = await client.patch<Project>(`/api/orgs/${orgId}/projects/${projectId}`, data)
  return res.data
}

export async function apiDeleteProject(orgId: string, projectId: string): Promise<void> {
  await client.delete(`/api/orgs/${orgId}/projects/${projectId}`)
}

export async function apiGetProjectMembers(
  orgId: string,
  projectId: string,
): Promise<ProjectMember[]> {
  const res = await client.get<ProjectMember[]>(
    `/api/orgs/${orgId}/projects/${projectId}/members`,
  )
  return res.data
}