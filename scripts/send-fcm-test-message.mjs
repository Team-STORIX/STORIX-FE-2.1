#!/usr/bin/env node
// scripts/send-fcm-test-message.mjs
//
// Dev-only helper. Sends a single FCM notification message to a specific
// device-registration token, bypassing the Firebase Console "Send test
// message" UI. The Console UI accepts the wrong identifier (Installation ID)
// silently and is the most common cause of "Console sends but device never
// receives" reports — this script removes that variable from the equation.
//
// IMPORTANT
//  - Requires a Firebase Admin SDK service-account key (JSON).
//  - The service-account JSON has FULL PROJECT PRIVILEGES. NEVER commit it.
//    .gitignore already excludes common filenames; double-check before any
//    git add.
//  - This script is local-only. Do not bundle it into the app.

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const TAG = '[fcm-test]'

const die = (msg, code = 1) => {
  console.error(`${TAG} ${msg}`)
  process.exit(code)
}

// ─── 0. parse args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const token = args[0]

if (!token) {
  die(
    'Usage: node scripts/send-fcm-test-message.mjs "<FCM_REGISTRATION_TOKEN>"\n' +
      '  Token comes from the FCM registration token logged by the running\n' +
      '  iOS/Android app — NOT the Firebase Installation ID and NOT the\n' +
      '  APNs token.',
  )
}

if (token.length < 100) {
  console.warn(
    `${TAG} WARNING: token length=${token.length}. FCM registration tokens are\n` +
      '  typically 140–200 characters long. If this is shorter, you may have\n' +
      '  copied an Installation ID or APNs token by mistake.',
  )
}

// ─── 1. locate credentials ──────────────────────────────────────────────────
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!credPath) {
  die(
    'GOOGLE_APPLICATION_CREDENTIALS is not set.\n\n' +
      'Create a service-account key (one-time):\n' +
      '  1. Firebase Console → Project settings → Service accounts\n' +
      '  2. Click "Generate new private key" (project: storix-f5729)\n' +
      '  3. Save the downloaded JSON OUTSIDE the git repo, e.g.\n' +
      '       ~/.config/storix/firebase-service-account.json\n' +
      '  4. Run:\n' +
      '       export GOOGLE_APPLICATION_CREDENTIALS=~/.config/storix/firebase-service-account.json\n' +
      '       node scripts/send-fcm-test-message.mjs "<FCM_TOKEN>"\n\n' +
      'NEVER commit the JSON — it carries full project privileges.',
  )
}

const resolvedCred = resolve(credPath.replace(/^~/, process.env.HOME ?? ''))
if (!existsSync(resolvedCred)) {
  die(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${resolvedCred}`)
}

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(resolvedCred, 'utf8'))
} catch (err) {
  die(`Failed to parse service-account JSON: ${err.message}`)
}

if (!serviceAccount.project_id || !serviceAccount.client_email) {
  die(
    'Service-account JSON is missing required fields. Re-download from\n' +
      'Firebase Console → Service accounts → Generate new private key.',
  )
}

// Sanity-check the project identity matches the iOS GoogleService-Info.plist.
const EXPECTED_PROJECT_ID = 'storix-f5729'
if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
  console.warn(
    `${TAG} WARNING: service-account project_id="${serviceAccount.project_id}"\n` +
      `  does not match the iOS app's PROJECT_ID="${EXPECTED_PROJECT_ID}".\n` +
      '  Sending will fail with sender-id-mismatch.',
  )
}

// ─── 2. load firebase-admin ─────────────────────────────────────────────────
let admin
try {
  admin = await import('firebase-admin')
} catch {
  die(
    'firebase-admin is not installed.\n\n' +
      'Install it as a dev dependency (will be hoisted to node_modules):\n' +
      '  npm install -D firebase-admin\n\n' +
      'Then re-run this script.',
  )
}

const app =
  admin.default.apps.length > 0
    ? admin.default.app()
    : admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount),
      })

// ─── 3. build + send message ────────────────────────────────────────────────
const message = {
  token,
  notification: {
    title: 'STORIX 테스트',
    body: 'FCM 직접 발송 테스트입니다.',
  },
  data: {
    source: 'direct-fcm-test',
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
      },
    },
  },
}

console.log(`${TAG} project=${serviceAccount.project_id}`)
console.log(
  `${TAG} token preview=${token.slice(0, 12)}…(len=${token.length})`,
)
console.log(`${TAG} sending…`)

try {
  const messageId = await app.messaging().send(message)
  console.log(`${TAG} ✅ success — messageId=${messageId}`)
  console.log(
    `${TAG} FCM has accepted the token. If the device still receives nothing,\n` +
      '  the problem is between FCM ↔ APNs (foreground vs background, APNs\n' +
      '  key/cert, aps-environment mismatch) or the app is not the foreground\n' +
      '  recipient. See the decision table in PUSH_NOTIFICATION_SETUP.md.',
  )
  process.exit(0)
} catch (err) {
  const code = err?.errorInfo?.code ?? err?.code ?? 'unknown'
  console.error(`${TAG} ❌ send failed — code=${code}`)
  console.error(`${TAG} message: ${err?.message ?? err}`)

  switch (code) {
    case 'messaging/registration-token-not-registered':
      console.error(
        `${TAG} → Token is stale / app reinstalled / project changed.\n` +
          '  Rebuild the app and copy the new FCM registration token.',
      )
      break
    case 'messaging/sender-id-mismatch':
      console.error(
        `${TAG} → Token belongs to a different Firebase project than the\n` +
          '  service-account JSON. Confirm both come from project "storix-f5729".',
      )
      break
    case 'messaging/invalid-registration-token':
    case 'messaging/invalid-argument':
      console.error(
        `${TAG} → Malformed or truncated token. Re-copy the full FCM\n` +
          '  registration token from the device log.',
      )
      break
    case 'messaging/third-party-auth-error':
      console.error(
        `${TAG} → APNs Auth Key/Cert is missing or invalid in Firebase Console.\n` +
          '  Firebase Console → Project settings → Cloud Messaging → Apple\n' +
          '  app config → upload the APNs .p8 (with Team ID + Key ID).',
      )
      break
    default:
      console.error(
        `${TAG} → Unrecognised error. Inspect the message above and the Admin\n` +
          '  SDK docs: https://firebase.google.com/docs/cloud-messaging/send-message',
      )
  }
  process.exit(2)
}
