import { useInfiniteQuery } from '@tanstack/react-query'
import { searchTopicRoomsSlice } from '../api/topicroom.api'

export const useTopicRoomSearchInfinite = (
  keyword: string,
  size = 20,
  sort?: string[],
) => {
  const k = keyword.trim()
  return useInfiniteQuery({
    queryKey: ['topicroom', 'search', 'infinite', k, size, sort],
    enabled: !!k,
    queryFn: ({ pageParam }) =>
      searchTopicRoomsSlice({ keyword: k, page: Number(pageParam), size, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return (lastPage.number ?? 0) + 1
    },
  })
}
