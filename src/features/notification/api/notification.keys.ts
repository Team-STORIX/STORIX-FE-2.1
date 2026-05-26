/**
 * Stable React Query keys for the notification feature.
 * Centralised so hooks and invalidations never drift apart.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (size: number) => ['notifications', 'list', { size }] as const,
  listRoot: ['notifications', 'list'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  settings: ['notifications', 'settings'] as const,
}
