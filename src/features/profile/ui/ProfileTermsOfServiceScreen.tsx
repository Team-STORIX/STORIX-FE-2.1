import { LegalDocumentScreen } from './LegalDocumentScreen'
import { TERMS_OF_SERVICE_MARKDOWN } from './termsOfServiceContent'

export function ProfileTermsOfServiceScreen() {
  return (
    <LegalDocumentScreen
      title="서비스 이용약관"
      markdown={TERMS_OF_SERVICE_MARKDOWN}
      versionLabel="버전 1 (26.07.07)"
    />
  )
}
