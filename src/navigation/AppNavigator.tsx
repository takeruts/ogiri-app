import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';
import { logScreenView } from '../utils/analytics';

import { GameScreen } from '../screens/GameScreen';
import { PhotoGameScreen } from '../screens/PhotoGameScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// タブアイコン用のシンプルなコンポーネント
const TabIcon = ({ icon }: { icon: string }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

const MainTabs = () => {
  const { session } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{
          tabBarLabel: '診断',
          tabBarIcon: () => <TabIcon icon="🎯" />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: '履歴',
          tabBarIcon: () => <TabIcon icon="📊" />,
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={session ? MyPageScreen : AuthScreen}
        options={{
          tabBarLabel: session ? 'マイページ' : 'ログイン',
          tabBarIcon: () => <TabIcon icon={session ? '👤' : '🔐'} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { loading } = useAuth();
  const navRef = useNavigationContainerRef();

  // Web用のドキュメントタイトルを設定
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'お笑い偏差値診断 - AIお笑いセンス診断';
    }
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => {
        const route = navRef.getCurrentRoute();
        if (route?.name) logScreenView(route.name);
      }}
      onStateChange={() => {
        const route = navRef.getCurrentRoute();
        if (route?.name) logScreenView(route.name);
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{
            headerShown: true,
            title: 'プロフィール編集'
          }}
        />
        <Stack.Screen
          name="PhotoGame"
          component={PhotoGameScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
