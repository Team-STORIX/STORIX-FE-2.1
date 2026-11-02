import { useMutation } from '@tanstack/react-query'
import {
  postBoardImagePresignedUrls,
  uploadToPresignedUrl,
} from '../../api/plus/plus.api'
import { createReaderBoard } from '../../api/plus/plusWrite'
import type { CreateBoardBody } from '../../api/plus/plusWrite'
import {
  trackCreateFeedPost,
  trackUseFeedFeature,
} from '../../../../lib/analytics/events'

export type FeedWriteImage = {
  uri: string
  contentType: string
}

type CreateReaderBoardArgs = CreateBoardBody & {
  images?: FeedWriteImage[]
}

function getCreatedBoardId(response: unknown): number | null {
  const result = (response as any)?.result ?? response
  const id = result?.boardId ?? result?.id ?? result?.readerBoardId
  return typeof id === 'number' && Number.isFinite(id) ? id : null
}

export function useCreateReaderBoard() {
  return useMutation({
    mutationFn: async ({ images = [], ...payload }: CreateReaderBoardArgs) => {
      let response: unknown

      if (images.length === 0) {
        response = await createReaderBoard(payload)
      } else {
        const presignRes = await postBoardImagePresignedUrls({
          files: images.map((image) => ({ contentType: image.contentType })),
        })
        const presigned = presignRes.result

        await Promise.all(
          presigned.map((item, index) =>
            uploadToPresignedUrl({
              url: item.url,
              uri: images[index].uri,
              contentType: images[index].contentType,
            }),
          ),
        )

        response = await createReaderBoard({
          ...payload,
          files: presigned.map((item) => ({ objectKey: item.objectKey })),
        })
      }

      const boardId = getCreatedBoardId(response)
      await trackCreateFeedPost({
        post_id: boardId != null ? `post_${boardId}` : 'post_unknown',
        has_spoiler: payload.isSpoiler === true,
        theme_type: payload.theme === 'BIRTHDAY' ? 'birthday' : 'default',
      })

      if (payload.isSpoiler === true) {
        await trackUseFeedFeature({
          feature_name: 'spoiler',
          target_type: 'post',
        })
      }

      if (payload.theme === 'BIRTHDAY') {
        await trackUseFeedFeature({
          feature_name: 'birthday_theme',
          target_type: 'post',
        })
      }

      return response
    },
  })
}
