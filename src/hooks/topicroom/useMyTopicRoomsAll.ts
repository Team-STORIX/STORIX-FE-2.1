import { useQuery } from '@tanstack/react-query'
import { getMyTopicRooms } from '../../lib/api/topicroom/topicroom.api'

type Params = {
  size?: number
  sort?: string[]
  enabled?: boolean
  maxPages?: number
}

export const useMyTopicRoomsAll = ({
  size = 3,
  sort = ['topicRoom.lastChatTime,DESC'],
  enabled = true,
  maxPages = 30,
}: Params = {}) =>
  useQuery({
    queryKey: ['topicroom', 'me', 'list', 'all', size, sort.join('|')],
    enabled,
    queryFn: async () => {
      const all = []
      let page = 0
      for (let i = 0; i < maxPages; i++) {
        const res = await getMyTopicRooms({ page, size, sort })
        all.push(...(res.content ?? []))
        if (res.last || res.empty) break
        page = (res.number ?? page) + 1
      }
      return all
    },
  })
