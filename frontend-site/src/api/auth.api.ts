import client from './client'

export interface UserMe {
  id: string
  email: string
  display_name: string
  is_active: boolean
  is_verified: boolean
}

export async function apiLogin(email: string, password: string): Promise<void> {
  const form = new URLSearchParams({ username: email, password })
  await client.post('/api/auth/cookie/login', form)
}

export async function apiRegister(
  email: string,
  password: string,
  display_name: string,
): Promise<UserMe> {
  const res = await client.post<UserMe>('/api/auth/cookie/register', {
    email,
    password,
    display_name,
  })
  return res.data
}

export async function apiMe(): Promise<UserMe> {
  const res = await client.get<UserMe>('/api/users/me')
  return res.data
}

export async function apiLogout(): Promise<void> {
  await client.post('/api/auth/cookie/logout')
}