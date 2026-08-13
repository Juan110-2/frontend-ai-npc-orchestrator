import { request } from './http'

export type BackendUserProfile = {
  id: string
  email: string
  full_name: string | null
  role: 'student' | 'teacher' | 'admin'
  created_at: string
  updated_at: string
}

export async function getMyProfile() {
  return request<BackendUserProfile>('/admin/me')
}

export async function adminListUsers() {
  return request<BackendUserProfile[]>('/admin/users')
}

export async function listStudents() {
  return request<BackendUserProfile[]>('/admin/students')
}

export async function adminUpdateUser(
  userId: string,
  payload: { role?: 'student' | 'teacher' | 'admin'; full_name?: string },
) {
  return request<BackendUserProfile>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
