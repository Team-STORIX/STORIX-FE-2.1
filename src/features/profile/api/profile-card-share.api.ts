import { apiClient } from '../../../lib/api/axios-instance'

type ApiEnvelope<T> = {
  result: T
}

type ProfileCardImagePresignResult = {
  url: string
  objectKey: string
}

type ProfileCardShareResult = {
  shareUrl: string
}

export async function postProfileCardImagePresignedUrl(contentType: string) {
  const { data } = await apiClient.post<
    ApiEnvelope<ProfileCardImagePresignResult>
  >('/api/v1/image/profile-card', {
    file: { contentType },
  })

  return data.result
}

export async function createProfileCardShare(objectKey: string) {
  const { data } = await apiClient.post<ApiEnvelope<ProfileCardShareResult>>(
    '/api/v1/profile/card/share',
    { objectKey },
  )

  return data.result
}

export async function uploadProfileCardImage(params: {
  url: string
  uri: string
  contentType: string
}) {
  const image = await fetch(params.uri)
  const blob = await image.blob()

  const res = await fetch(params.url, {
    method: 'PUT',
    headers: {
      'Content-Type': params.contentType,
    },
    body: blob,
  })

  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`)
  }
}
