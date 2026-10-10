import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { normalizeLinkUrl } from './linkify'

/**
 * Single choke point for opening a link written by another user.
 *
 * Everything goes to the in-app browser tab: the URL bar stays visible (a
 * phishing cue the OS browser would also give, but without leaving the app).
 * A confirmation step, a host allow-list, or in-app routing for storix.kr
 * paths can be added here without touching a single call site.
 */
export async function openExternalLink(value: string): Promise<void> {
  const url = normalizeLinkUrl(value)
  if (url == null) return

  try {
    await WebBrowser.openBrowserAsync(url)
  } catch {
    // Devices without a Custom Tabs / SFSafariViewController provider fall
    // back to whatever browser the system has registered.
    await Linking.openURL(url).catch(() => undefined)
  }
}
