import client from './client'
import type { UserMe } from './auth.api'

export const apiUpdateProfile = (data: { display_name?: string; email?: string; password?: string }) =>
  client.patch<UserMe>('/api/users/me', data).then((r) => r.data)

export const apiDeleteUserAvatar = () =>
  client.delete('/api/users/avatar/me')