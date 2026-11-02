import { Slot } from 'expo-router'
import { PreferenceFlowProvider } from '../../../src/features/preference/hooks/usePreferenceFlow'

export default function PreferenceLayout() {
  return (
    <PreferenceFlowProvider>
      <Slot />
    </PreferenceFlowProvider>
  )
}
