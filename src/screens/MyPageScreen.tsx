import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

// ウェブとモバイルの両方で動作する確認ダイアログ
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'OK', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// ウェブとモバイルの両方で動作するアラート
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

type TabType = 'topics' | 'answers';

interface Topic {
  id: string;
  title: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}

interface Answer {
  id: string;
  content: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  topics: {
    title: string;
  };
}

export const MyPageScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('topics');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();

  const fetchMyTopics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('お題取得エラー:', error);
    }
  };

  const fetchMyAnswers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*, topics(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnswers(data || []);
    } catch (error) {
      console.error('回答取得エラー:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('管理者確認エラー:', error);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchMyTopics(), fetchMyAnswers(), checkAdminStatus()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSignOut = async () => {
    showConfirm(
      'ログアウト',
      'ログアウトしますか?',
      async () => {
        try {
          await signOut();
        } catch (error: any) {
          showAlert('エラー', error.message);
        }
      }
    );
  };

  const renderTopic = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('ja-JP')}
        </Text>
        <View style={styles.reactions}>
          <Text style={styles.reactionText}>👍 {item.likes_count}</Text>
          <Text style={styles.reactionText}>👎 {item.dislikes_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAnswer = ({ item }: { item: Answer }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.topicTitle}>{item.topics.title}</Text>
      <Text style={styles.answerContent}>{item.content}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('ja-JP')}
        </Text>
        <View style={styles.reactions}>
          <Text style={styles.reactionText}>👍 {item.likes_count}</Text>
          <Text style={styles.reactionText}>👎 {item.dislikes_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{user?.email}</Text>
        <View style={styles.headerButtons}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Admin')}
            >
              <Text style={styles.adminButtonText}>管理者</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{topics.length}</Text>
          <Text style={styles.statLabel}>投稿したお題</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{answers.length}</Text>
          <Text style={styles.statLabel}>投稿した回答</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'topics' && styles.tabActive]}
          onPress={() => setActiveTab('topics')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'topics' && styles.tabTextActive,
            ]}
          >
            投稿したお題
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'answers' && styles.tabActive]}
          onPress={() => setActiveTab('answers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'answers' && styles.tabTextActive,
            ]}
          >
            投稿した回答
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'topics' ? topics : answers}
        renderItem={activeTab === 'topics' ? renderTopic : renderAnswer}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading
                ? '読み込み中...'
                : activeTab === 'topics'
                ? 'まだお題を投稿していません'
                : 'まだ回答を投稿していません'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  username: {
    ...typography.h3,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adminButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  adminButtonText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  logoutButtonText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textLight,
  },
  tabTextActive: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  topicTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  answerContent: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textLight,
  },
  reactions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reactionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },
});
