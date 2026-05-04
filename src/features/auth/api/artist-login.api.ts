import { apiClient } from '../../../lib/api/axios-instance'

export type ArtistLoginRequest = {
  loginId: string
  password: string
}

export type ArtistLoginResponse = {
  isSuccess: boolean
  code: string
  message: string
  result?: {
    accessToken?: string
  }
  timestamp: string
}

/**
 * Writer (artist) credential login.
 * Used by the writers' section of the app — separate from reader social login.
 */
export async function artistLoginUser(body: ArtistLoginRequest): Promise<ArtistLoginResponse> {
  const res = await apiClient.post<ArtistLoginResponse>(
    '/api/v1/auth/users/artist/login',
    body,
  )
  return res.data
}
