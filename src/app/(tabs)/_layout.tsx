import { Tabs } from 'expo-router/js-tabs';

import { BasketIcon, BookIcon, CalendarIcon, GearIcon } from '@/features/tabs/icons';
import { TabBar } from '@/features/tabs/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Дни', tabBarIcon: CalendarIcon }} />
      <Tabs.Screen name="recipes" options={{ title: 'Рецепты', tabBarIcon: BookIcon }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Продукты', tabBarIcon: BasketIcon }} />
      <Tabs.Screen name="settings" options={{ title: 'Настройки', tabBarIcon: GearIcon }} />
    </Tabs>
  );
}
