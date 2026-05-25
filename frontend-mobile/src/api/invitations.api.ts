import client from './client'

export interface InvitationInfo {
  org_name: string
  email: string
  position: string
  is_registered: boolean
}

export interface MyInvitation {
  id: string
  token: string
  org_name: string
  position: string
  role: string
  created_at: string
}

export const apiGetInvitation = (token: string) =>
  client.get<InvitationInfo>(`/api/invitations/${token}`).then((r) => r.data)

export const apiAcceptInvitation = (token: string) =>
  client.post(`/api/invitations/${token}/accept`)

export const apiGetMyInvitations = () =>
  client.get<MyInvitation[]>('/api/invitations/my').then((r) => r.data)