import { LegalDocumentScreen } from './LegalDocumentScreen'
import { PRIVACY_POLICY_MARKDOWN } from './privacyPolicyContent'

export function ProfilePrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="개인정보 처리 방침"
      markdown={PRIVACY_POLICY_MARKDOWN}
      versionLabel="버전 1 (26.07.07)"
    />
  )
}
