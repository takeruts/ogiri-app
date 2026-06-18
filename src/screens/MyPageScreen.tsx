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
  Image,
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

interface HistoryItem {
  id: string;
  topic: string;
  answer: string;
  score: number;
  comment: string;
  created_at: string;
}

interface UserStats {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
}

export const MyPageScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();

  const fetchData = async () => {
    if (!user) return;

    try {
      // 履歴を取得
      const { data: historyData, error: historyError } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;
      setHistory(historyData || []);

      // 統計を計算
      if (historyData && historyData.length > 0) {
        const totalGames = historyData.length;
        const totalScore = historyData.reduce((sum, item) => sum + item.score, 0);
        const averageScore = totalScore / totalGames;
        const bestScore = Math.max(...historyData.map((item) => item.score));

        setStats({
          totalGames,
          totalScore,
          averageScore: Math.round(averageScore * 10) / 10,
          bestScore,
        });
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#FFD700';
    if (score >= 60) return '#4CAF50';
    if (score >= 40) return '#2196F3';
    return '#FF5722';
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
          <Text style={styles.scoreBadgeText}>{item.score}点</Text>
        </View>
      </View>
      <Text style={styles.topicText} numberOfLines={2}>{item.topic}</Text>
      <Text style={styles.answerLabel}>回答</Text>
      <Text style={styles.answerText} numberOfLines={2}>{item.answer}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>マイページ</Text>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('ProfileEdit')}
          >
            <Text style={styles.editButtonText}>編集</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalGames}</Text>
              <Text style={styles.statLabel}>挑戦数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalScore}</Text>
              <Text style={styles.statLabel}>総合得点</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.averageScore}</Text>
              <Text style={styles.statLabel}>平均点</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FFD700' }]}>{stats.bestScore}</Text>
              <Text style={styles.statLabel}>最高点</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>最近の履歴</Text>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '読み込み中...' : 'まだ挑戦履歴がありません'}
            </Text>
            {!loading && (
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => navigation.navigate('Game')}
              >
                <Text style={styles.homeButtonText}>お笑い偏差値診断へ</Text>
              </TouchableOpacity>
            )}
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  profileSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  email: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  editButtonText: {
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
  statsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textLight,
  },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  scoreBadgeText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  topicText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  answerLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  answerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },
  homeButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
