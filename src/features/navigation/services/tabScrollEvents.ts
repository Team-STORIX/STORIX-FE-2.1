type Listener = () => void

const listeners = new Set<Listener>()

export function emitFeedTabReselected() {
  listeners.forEach((listener) => listener())
}

export function subscribeFeedTabReselected(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
