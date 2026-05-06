import AsyncStorage from '@react-native-async-storage/async-storage'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  usePreferenceAnalyze,
  usePreferenceExploration,
  usePreferenceResults,
} from './usePreference'
import type {
  PreferenceExplorationWork,
  PreferenceResultWork,
} from '../api/preference.schema'

type Choice = 'like' | 'dislike'
type PreferenceState = Record<number, Choice | null>

const STORAGE_KEY = 'storix.preference.progress.v1'

const WORKS_TYPE_LABELS: Record<string, string> = {
  WEBTOON: '웹툰',
  WEBNOVEL: '웹소설',
  COMIC: '만화',
}

export type PreferenceWork = {
  id: number
  title: string
  author?: string
  illustrator?: string
  originalAuthor?: string
  imageUrl?: string | null
  worksType?: string
  genre: string
  description: string
  hashtags: string[]
  meta?: string
  ratingText?: string
}

type PreferenceFlowContextValue = {
  works: PreferenceWork[]
  state: PreferenceState
  currentIndex: number
  currentWork: PreferenceWork | null
  likedWorks: PreferenceWork[]
  dislikedWorks: PreferenceWork[]
  likedSuccessCount: number
  isDone: boolean
  isLimitedDay: boolean
  isLoading: boolean
  isInitializing: boolean
  isResultsLoading: boolean
  isSubmitting: boolean
  errorMessage: string | null
  toastMessage: string | null
  hideToast: () => void
  like: () => void
  dislike: () => void
  reset: () => void
  onFavoriteAdded: (worksId: number) => void
  onFavoriteRemoved: (worksId: number) => void
}

const PreferenceFlowContext =
  createContext<PreferenceFlowContextValue | null>(null)

function getWorksTypeLabel(worksType?: string | null) {
  if (!worksType) return ''
  return WORKS_TYPE_LABELS[worksType] ?? worksType
}

function buildInitialState(works: PreferenceWork[]): PreferenceState {
  const next: PreferenceState = {}
  for (const work of works) next[work.id] = null
  return next
}

function mapExplorationToWork(work: PreferenceExplorationWork): PreferenceWork {
  return {
    id: work.worksId,
    title: work.worksName ?? '',
    imageUrl: work.thumbnailUrl ?? null,
    worksType: getWorksTypeLabel(work.worksType),
    genre: work.genre ?? '',
    description: work.description ?? '',
    hashtags: Array.isArray(work.hashtags) ? work.hashtags : [],
    author: work.artistName ?? '',
  }
}

function mapResultToWork(work: PreferenceResultWork): PreferenceWork {
  const worksType = getWorksTypeLabel(work.worksType)
  const illustrator =
    work.originalAuthor && work.illustrator === work.originalAuthor
      ? ''
      : work.illustrator
  const authorLine = [work.originalAuthor, illustrator, worksType].filter(Boolean)

  return {
    id: work.worksId,
    title: work.worksName,
    imageUrl: work.thumbnailUrl ?? null,
    worksType,
    genre: work.genre ?? '',
    description: '',
    hashtags: [],
    meta: `${authorLine.join(' · ')} · ${work.genre}`,
    author: work.author ?? '',
    illustrator: work.illustrator ?? '',
    originalAuthor: work.originalAuthor ?? '',
  }
}

function sanitizeToastMessage(message: string) {
  return message.replace(/정상적인 요청입니다\.\s*/g, '').trim()
}

export function PreferenceFlowProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const explorationQuery = usePreferenceExploration()
  const resultsQuery = usePreferenceResults(true)
  const analyzeMutation = usePreferenceAnalyze()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limitedToastShownRef = useRef(false)

  const [storageReady, setStorageReady] = useState(false)
  const savedStateRef = useRef<PreferenceState | null>(null)
  const didInitRef = useRef(false)

  const [state, setState] = useState<PreferenceState>(() => buildInitialState([]))
  const [likedSuccessIds, setLikedSuccessIds] = useState<Set<number>>(
    () => new Set(),
  )

  const works = useMemo<PreferenceWork[]>(() => {
    const raw = explorationQuery.data?.result ?? []
    return raw.map(mapExplorationToWork)
  }, [explorationQuery.data])

  useEffect(() => {
    let active = true

    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return
        savedStateRef.current = JSON.parse(raw) as PreferenceState
      })
      .catch(() => {
        savedStateRef.current = null
      })
      .finally(() => {
        if (active) setStorageReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (didInitRef.current) return
    if (!storageReady) return
    if (works.length === 0) return

    const saved = savedStateRef.current
    const next = buildInitialState(works)

    if (saved) {
      for (const work of works) {
        const value = saved[work.id]
        next[work.id] = value === 'like' || value === 'dislike' ? value : null
      }
    }

    setState(next)
    didInitRef.current = true
  }, [storageReady, works])

  useEffect(() => {
    if (!didInitRef.current) return
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {})
  }, [state])

  const showToast = useCallback((message: string) => {
    const nextMessage = sanitizeToastMessage(message)
    if (!nextMessage) return

    setToastMessage(nextMessage)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)

    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 2000)
  }, [])

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setToastMessage(null)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const explorationList = explorationQuery.data?.result ?? []
  const isLimitedDay =
    explorationQuery.isSuccess &&
    Array.isArray(explorationList) &&
    explorationList.length === 0

  useEffect(() => {
    if (!isLimitedDay) return
    if (limitedToastShownRef.current) return

    limitedToastShownRef.current = true
    showToast(
      explorationQuery.data?.message?.trim() ||
        '오늘은 이미 취향 탐색을 완료했어요. 내일 다시 시도해 주세요.',
    )
  }, [explorationQuery.data, isLimitedDay, showToast])

  const currentIndex = useMemo(() => {
    return works.findIndex((work) => state[work.id] == null)
  }, [state, works])

  const currentWork = currentIndex >= 0 ? works[currentIndex] : null
  const isDone = currentWork == null

  const likedWorksLocal = useMemo(
    () => works.filter((work) => state[work.id] === 'like'),
    [state, works],
  )
  const dislikedWorksLocal = useMemo(
    () => works.filter((work) => state[work.id] === 'dislike'),
    [state, works],
  )

  const result = resultsQuery.data?.result
  const hasResultLists =
    !!result && result.likedWorks.length + result.dislikedWorks.length > 0
  const useServerResults = hasResultLists || isLimitedDay

  const onFavoriteAdded = useCallback((worksId: number) => {
    setLikedSuccessIds((prev) => {
      const next = new Set(prev)
      next.add(worksId)
      return next
    })
  }, [])

  const onFavoriteRemoved = useCallback((worksId: number) => {
    setLikedSuccessIds((prev) => {
      if (!prev.has(worksId)) return prev
      const next = new Set(prev)
      next.delete(worksId)
      return next
    })
  }, [])

  const likedWorks = useMemo(() => {
    if (useServerResults && result) return result.likedWorks.map(mapResultToWork)
    return likedWorksLocal
  }, [likedWorksLocal, result, useServerResults])

  const dislikedWorks = useMemo(() => {
    if (useServerResults && result) {
      return result.dislikedWorks.map(mapResultToWork)
    }
    return dislikedWorksLocal
  }, [dislikedWorksLocal, result, useServerResults])

  const submitChoice = useCallback(
    async (choice: Choice) => {
      if (!currentWork) return
      if (analyzeMutation.isPending) return

      const worksId = currentWork.id
      setState((prev) => ({ ...prev, [worksId]: choice }))

      try {
        await analyzeMutation.mutateAsync({
          worksId,
          isLiked: choice === 'like',
        })

        if (choice === 'like') {
          setLikedSuccessIds((prev) => {
            const next = new Set(prev)
            next.add(worksId)
            return next
          })
        }
      } catch {
        if (choice === 'like') {
          setLikedSuccessIds((prev) => {
            if (!prev.has(worksId)) return prev
            const next = new Set(prev)
            next.delete(worksId)
            return next
          })
        }
      }
    },
    [analyzeMutation, currentWork],
  )

  const like = useCallback(() => {
    void submitChoice('like')
  }, [submitChoice])

  const dislike = useCallback(() => {
    void submitChoice('dislike')
  }, [submitChoice])

  const reset = useCallback(() => {
    setState(buildInitialState(works))
    setLikedSuccessIds(new Set())
  }, [works])

  const isLoading = explorationQuery.isLoading && !explorationQuery.data
  const isInitializing = !storageReady || (works.length > 0 && !didInitRef.current)

  const value = useMemo<PreferenceFlowContextValue>(
    () => ({
      works,
      state,
      currentIndex,
      currentWork,
      likedWorks,
      dislikedWorks,
      likedSuccessCount: likedSuccessIds.size,
      isDone,
      isLimitedDay,
      isLoading,
      isInitializing,
      isResultsLoading: resultsQuery.isLoading && !resultsQuery.data,
      isSubmitting: analyzeMutation.isPending,
      errorMessage: explorationQuery.isError
        ? '요청에 실패했어요. 잠시 후 다시 시도해 주세요.'
        : null,
      toastMessage,
      hideToast,
      like,
      dislike,
      reset,
      onFavoriteAdded,
      onFavoriteRemoved,
    }),
    [
      analyzeMutation.isPending,
      currentIndex,
      currentWork,
      dislikedWorks,
      explorationQuery.isError,
      hideToast,
      isDone,
      isInitializing,
      isLimitedDay,
      isLoading,
      like,
      likedSuccessIds.size,
      likedWorks,
      onFavoriteAdded,
      onFavoriteRemoved,
      reset,
      resultsQuery.data,
      resultsQuery.isLoading,
      state,
      toastMessage,
      works,
      dislike,
    ],
  )

  return (
    <PreferenceFlowContext.Provider value={value}>
      {children}
    </PreferenceFlowContext.Provider>
  )
}

export function usePreferenceFlow() {
  const context = useContext(PreferenceFlowContext)
  if (!context) {
    throw new Error('usePreferenceFlow must be used within PreferenceFlowProvider')
  }
  return context
}
