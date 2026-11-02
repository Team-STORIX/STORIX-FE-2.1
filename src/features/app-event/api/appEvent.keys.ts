export const appEventKeys = {
  all: ['app-event'] as const,
  detail: (appEventId: number) => ['app-event', 'detail', appEventId] as const,
  titleEvents: ['app-event', 'title'] as const,
  popup: ['app-event', 'popup'] as const,
  banners: ['app-event', 'banner'] as const,
}
