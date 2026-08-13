import { request } from './http'

export type BackendProfile = {
  id: string
  name: string
  description: string
  traits: Record<string, unknown>
  behavior?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function listProfiles() {
  return request<BackendProfile[]>('/profiles/')
}

export async function getProfile(profileId: string) {
  return request<BackendProfile>(`/profiles/${profileId}`)
}

export async function createProfile(payload: {
  name: string
  description: string
  traits: Record<string, unknown>
  behavior?: Record<string, unknown>
}) {
  return request<BackendProfile>('/profiles/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProfile(
  profileId: string,
  payload: {
    name?: string
    description?: string
    traits?: Record<string, unknown>
    behavior?: Record<string, unknown>
  },
) {
  return request<BackendProfile>(`/profiles/${profileId}/update`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteProfile(profileId: string) {
  return request<void>(`/profiles/${profileId}/delete`, { method: 'DELETE' })
}
