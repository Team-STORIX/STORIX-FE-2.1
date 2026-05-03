import { useMutation } from '@tanstack/react-query'
import { createReaderBoard } from '../../api/plus/plusWrite'
import type { CreateBoardBody } from '../../api/plus/plusWrite'

export function useCreateReaderBoard() {
  return useMutation({
    mutationFn: (payload: CreateBoardBody) => createReaderBoard(payload),
  })
}
