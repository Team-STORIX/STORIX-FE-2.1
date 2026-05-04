export type SortLatest = 'LATEST'

export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type PageableSort = {
  unsorted: boolean
  sorted: boolean
  empty: boolean
}

export type Pageable = {
  unpaged: boolean
  pageNumber: number
  paged: boolean
  pageSize: number
  offset: number
  sort: PageableSort
}

export type PageResult<T> = {
  numberOfElements: number
  pageable: Pageable
  size: number
  content: T[]
  number: number
  sort: PageableSort
  first: boolean
  last: boolean
  empty: boolean
}

export type FavoriteWork = {
  worksId: number
  worksName: string
  artistName: string
  thumbnailUrl: string | null
  worksType: string
  isReviewed: boolean
  rating?: string
}

export type FavoriteArtist = {
  artistId: number
  profileImageUrl: string | null
  artistName: string
  profileDescription: string
}

export type FavoriteWorksResponse = {
  totalFavoriteWorksCount: number
  result: PageResult<FavoriteWork>
}

export type FavoriteArtistsResponse = {
  totalFavoriteArtistCount: number
  result: PageResult<FavoriteArtist>
}

export type RatingCountsMap = Record<string, number>

export type ReaderRatingsResponse = ApiEnvelope<{
  ratingCounts: RatingCountsMap
}>

export type HashtagRankingResponse = {
  rankings: Record<number, string>
}

export type FavoriteArtistPreview = {
  id: number
  name: string
  imageUrl: string | null
}

export type FavoriteWorkPreview = {
  id: number
  title: string
  author: string
  imageUrl: string | null
}
