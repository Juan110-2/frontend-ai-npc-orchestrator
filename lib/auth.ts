export const AUTH_COOKIE_NAME = 'psicosim_auth'

export function setAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
}
