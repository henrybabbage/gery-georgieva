import 'server-only'

export const token = process.env.SANITY_API_READ_TOKEN?.trim() || undefined

export function requireToken(): string {
  if (!token) {
    throw new Error('Missing SANITY_API_READ_TOKEN')
  }
  return token
}
