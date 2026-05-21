import client from './client'

export interface InvitationInfo {
  org_name: string
  email: string
  position: string
  is_registered: boolean
}

export async function apiGetInvitation(token: string): Promise<InvitationInfo> {
  const res = await client.get<InvitationInfo>(`/api/invitations/${token}`)
  return res.data
}

export async function apiAcceptInvitation(token: string): Promise<void> {
  await client.post(`/api/invitations/${token}/accept`)
}