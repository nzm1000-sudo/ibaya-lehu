import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { S } from '@/constants/strings';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" options={{ title: S.tabs.home }} />
      <Tabs.Screen name="topics" options={{ title: S.tabs.topics }} />
      <Tabs.Screen name="saved" options={{ title: S.tabs.saved }} />
    </Tabs>
  );
}
