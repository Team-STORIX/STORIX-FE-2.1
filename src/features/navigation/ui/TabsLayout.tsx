import { Tabs } from 'expo-router'
import { useClientOnlyValue } from '../../../../components/useClientOnlyValue'
import { BottomNavBar } from './BottomNavBar'

export function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="feed" options={{ title: '피드' }} />
      <Tabs.Screen name="two" options={{ href: null, title: '토픽룸' }} />
      <Tabs.Screen name="library" options={{ title: '서재' }} />
      <Tabs.Screen name="profile" options={{ title: '프로필' }} />
    </Tabs>
  )
}
