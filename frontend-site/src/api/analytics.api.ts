import client from './client'

export interface OverviewData {
  total: number
  backlog: number
  todo: number
  in_progress: number
  review: number
  done: number
}

export interface MemberWorkload {
  user: { id: string; email: string; display_name: string }
  task_count: number
}

export interface TimelineEntry {
  date: string
  count: number
}

export interface PrioritiesData {
  low: number
  medium: number
  high: number
  critical: number
}

export const apiGetOverview = (orgId: string) =>
  client.get<OverviewData>(`/api/orgs/${orgId}/analytics/overview`).then((r) => r.data)

export const apiGetMembersWorkload = (orgId: string) =>
  client.get<MemberWorkload[]>(`/api/orgs/${orgId}/analytics/members`).then((r) => r.data)

export const apiGetTimeline = (orgId: string) =>
  client.get<TimelineEntry[]>(`/api/orgs/${orgId}/analytics/timeline`).then((r) => r.data)

export const apiGetPriorities = (orgId: string) =>
  client.get<PrioritiesData>(`/api/orgs/${orgId}/analytics/priorities`).then((r) => r.data)