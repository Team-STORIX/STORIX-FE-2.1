import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { SignupRequest } from '../../auth/api/auth.schema'
import { useSignup } from '../../auth/hooks/useSignup'
import { getMyProfile, uploadAndSetProfileImage } from '../../profile/api/profile.api'
import { ME_QUERY_KEY } from '../../profile/hooks/useMe'
import { useProfileStore } from '../../profile/store/profile.store'

type CompleteSignupInput = {
  request: SignupRequest
  profileImageUri?: string
}

/**
 * 회원가입 요청 → (선택) 프로필 이미지 업로드 → 내 프로필 동기화.
 * 가입 자체가 실패하면 throw 하고, 가입 이후의 동기화 실패는 로그만 남긴다.
 */
export function useCompleteSignup() {
  const queryClient = useQueryClient()
  const signupMutation = useSignup()
  const setMe = useProfileStore((s) => s.setMe)
  const [isCompleting, setIsCompleting] = useState(false)

  const completeSignup = async ({ request, profileImageUri }: CompleteSignupInput) => {
    setIsCompleting(true)
    try {
      await signupMutation.mutateAsync(request)

      try {
        if (profileImageUri) {
          await uploadAndSetProfileImage(profileImageUri)
        }

        const meResponse = await getMyProfile()
        if (meResponse.result) {
          setMe(meResponse.result)
          queryClient.setQueryData(ME_QUERY_KEY, meResponse.result)
        }
        await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
      } catch (syncError) {
        console.log('[useCompleteSignup] failed to sync profile after signup:', syncError)
      }
    } finally {
      setIsCompleting(false)
    }
  }

  return {
    completeSignup,
    isCompleting: isCompleting || signupMutation.isPending,
  }
}
