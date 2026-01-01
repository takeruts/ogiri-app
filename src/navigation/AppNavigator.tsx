import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateTopicScreen } from '../screens/CreateTopicScreen';
import { TopicDetailScreen } from '../screens/TopicDetailScreen';
import { CreateAnswerScreen } from '../screens/CreateAnswerScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';
import { AdminScreen } from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{
          title: 'ランキング',
          tabBarLabel: 'ランキング',
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: 'マイページ',
          tabBarLabel: 'マイページ',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { session, loading } = useAuth();

  // Web用のドキュメントタイトルを設定
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'オオギリハブ - みんなで楽しむお題と回答投稿コミュニティ';
    }
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              headerShown: false,
              title: 'オオギリハブ'
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateTopic"
              component={CreateTopicScreen}
              options={{ title: 'お題を投稿' }}
            />
            <Stack.Screen
              name="TopicDetail"
              component={TopicDetailScreen}
              options={{ title: 'お題詳細' }}
            />
            <Stack.Screen
              name="CreateAnswer"
              component={CreateAnswerScreen}
              options={{ title: '回答を投稿' }}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              options={{ title: 'プロフィール編集' }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{ title: '管理者画面' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
