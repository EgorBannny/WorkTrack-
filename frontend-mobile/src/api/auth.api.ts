import client from './client'
import * as SecureStore from 'expo-secure-store'

export interface UserMe {
  id: string
  email: string
  display_name: string
  is_active: boolean
  is_verified: boolean
}

export async function apiLogin(email: string, password: string): Promise<void> {
  const body = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  const res = await client.post<{ access_token: string; refresh_token: string }>(
    '/api/auth/bearer/login',
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  )
  await SecureStore.setItemAsync('access_token', res.data.access_token)
  await SecureStore.setItemAsync('refresh_token', res.data.refresh_token)
}

export async function apiRegister(
  email: string,
  password: string,
  display_name: string,
): Promise<UserMe> {
  const res = await client.post<UserMe>('/api/auth/bearer/register', {
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
  try {
    await client.post('/api/auth/bearer/logout')
  } finally {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
  }
}