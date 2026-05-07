import { useMutation } from '@tanstack/react-query'
import {
  postBoardImagePresignedUrls,
  uploadToPresignedUrl,
} from '../../api/plus/plus.api'
import { createReaderBoard } from '../../api/plus/plusWrite'
import type { CreateBoardBody } from '../../api/plus/plusWrite'

export type FeedWriteImage = {
  uri: string
  contentType: string
}

type CreateReaderBoardArgs = CreateBoardBody & {
  images?: FeedWriteImage[]
}

export function useCreateReaderBoard() {
  return useMutation({
    mutationFn: async ({ images = [], ...payload }: CreateReaderBoardArgs) => {
      if (images.length === 0) {
        return createReaderBoard(payload)
      }

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

      return createReaderBoard({
        ...payload,
        files: presigned.map((item) => ({ objectKey: item.objectKey })),
      })
    },
  })
}
