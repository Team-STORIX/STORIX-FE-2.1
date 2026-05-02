import { useQuery } from '@tanstack/react-query'
import { getRecommendedHashtags } from '../../lib/api/hashtag/hashtag.api'

export const useRecommendedHashtags = () =>
  useQuery({
    queryKey: ['hashtags', 'recommendations'],
    queryFn: getRecommendedHashtags,
  })
