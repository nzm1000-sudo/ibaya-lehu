import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" options={{ title: 'בית' }} />
      <Tabs.Screen name="topics" options={{ title: 'נושאים' }} />
      <Tabs.Screen name="saved" options={{ title: 'שמורים' }} />
    </Tabs>
  );
}
