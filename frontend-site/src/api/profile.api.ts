import client from './client'
import type { UserMe } from './auth.api'

export async function apiUpdateProfile(data: {
  display_name?: string
  email?: string
  password?: string
}): Promise<UserMe> {
  const res = await client.patch<UserMe>('/api/users/me', data)
  return res.data
}

export async function apiUploadUserAvatar(blob: Blob): Promise<void> {
  const form = new FormData()
  form.append('file', blob, 'avatar.jpg')
  await client.post('/api/users/avatar/me', form)
}

export async function apiDeleteUserAvatar(): Promise<void> {
  await client.delete('/api/users/avatar/me')
}