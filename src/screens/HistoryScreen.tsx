import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

interface TopScoreItem {
  id: string;
  topic: string;
  answer: string;
  score: number;
  answer_time: number | null;
  created_at: string;
  nickname: string;
}

interface PopularTopicItem {
  topic: string;
  challenge_count: number;
  average_score: number;
  best_score: number;
  fastest_time: number | null;
}

interface HistoryItem {
  id: string;
  topic: string;
  answer: string;
  score: number;
  comment: string;
  hint: string;
  answer_time: number | null;
  created_at: string;
}

interface UserStats {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
}

type TabType = 'ranking' | 'popular' | 'history';

export const HistoryScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('ranking');
  const [topScores, setTopScores] = useState<TopScoreItem[]>([]);
  const [popularTopics, setPopularTopics] = useState<PopularTopicItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopScores = async () => {
    try {
      const { data, error } = await supabase
        .from('top_scores')
        .select('*')
        .limit(100);

      if (error) throw error;
      setTopScores(data || []);
    } catch (error) {
      console.error('トップスコア取得エラー:', error);
    }
  };

  const fetchPopularTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('popular_topics')
        .select('*')
        .limit(100);

      if (error) throw error;
      setPopularTopics(data || []);
    } catch (error) {
      console.error('人気お題取得エラー:', error);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data: historyData, error: historyError } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;
      setHistory(historyData || []);

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
      console.error('履歴取得エラー:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTopScores(), fetchPopularTopics(), fetchHistory()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#FFD700';
    if (score >= 60) return '#4CAF50';
    if (score >= 40) return '#2196F3';
    return '#FF5722';
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}分${sec}秒`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  // お題に挑戦する
  const handleChallengeTopic = (topic: string) => {
    navigation.navigate('Game', {
      challengeTopic: {
        topic,
        source: activeTab === 'ranking' ? 'ranking' : 'popular',
      },
    });
  };

  // トップ100ランキング表示
  const renderTopScoreItem = ({ item, index }: { item: TopScoreItem; index: number }) => (
    <View style={styles.rankingCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{getRankEmoji(index + 1)}</Text>
      </View>
      <View style={styles.rankingContent}>
        <View style={styles.rankingHeader}>
          <Text style={styles.rankingNickname}>{item.nickname}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
            <Text style={styles.scoreBadgeText}>{item.score}点</Text>
          </View>
        </View>
        <Text style={styles.rankingTopic} numberOfLines={2}>{item.topic}</Text>
        <Text style={styles.rankingAnswer} numberOfLines={2}>{item.answer}</Text>
        <View style={styles.rankingFooter}>
          <Text style={styles.rankingTime}>
            {item.answer_time ? `${formatTime(item.answer_time)}` : ''}
          </Text>
          <TouchableOpacity
            style={styles.challengeButton}
            onPress={() => handleChallengeTopic(item.topic)}
          >
            <Text style={styles.challengeButtonText}>このお題に挑戦</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // 人気お題表示
  const renderPopularTopicItem = ({ item, index }: { item: PopularTopicItem; index: number }) => (
    <View style={styles.popularCard}>
      <View style={styles.popularHeader}>
        <Text style={styles.popularRank}>{index + 1}位</Text>
        <Text style={styles.popularCount}>{item.challenge_count}人が挑戦</Text>
      </View>
      <Text style={styles.popularTopic}>{item.topic}</Text>
      <View style={styles.popularStats}>
        <View style={styles.popularStatItem}>
          <Text style={styles.popularStatLabel}>平均点</Text>
          <Text style={[styles.popularStatValue, { color: getScoreColor(item.average_score) }]}>
            {item.average_score}
          </Text>
        </View>
        <View style={styles.popularStatItem}>
          <Text style={styles.popularStatLabel}>最高点</Text>
          <Text style={[styles.popularStatValue, { color: '#FFD700' }]}>
            {item.best_score}
          </Text>
        </View>
        <View style={styles.popularStatItem}>
          <Text style={styles.popularStatLabel}>最速</Text>
          <Text style={styles.popularStatValue}>
            {formatTime(item.fastest_time)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.challengeButtonLarge}
        onPress={() => handleChallengeTopic(item.topic)}
      >
        <Text style={styles.challengeButtonLargeText}>このお題に挑戦</Text>
      </TouchableOpacity>
    </View>
  );

  // 履歴表示
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View style={styles.cardHeaderRight}>
          {item.answer_time && (
            <Text style={styles.answerTime}>{formatTime(item.answer_time)}</Text>
          )}
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
            <Text style={styles.scoreBadgeText}>{item.score}点</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>お題</Text>
      <Text style={styles.topicText}>{item.topic}</Text>

      <Text style={styles.sectionLabel}>回答</Text>
      <Text style={styles.answerText}>{item.answer}</Text>

      <Text style={styles.sectionLabel}>採点コメント</Text>
      <Text style={styles.commentText}>{item.comment}</Text>

      {item.hint && (
        <>
          <Text style={styles.sectionLabel}>ヒント</Text>
          <Text style={styles.hintText}>{item.hint}</Text>
        </>
      )}
    </View>
  );

  const renderRankingTab = () => (
    <FlatList
      data={topScores}
      renderItem={renderTopScoreItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>高得点ランキング TOP100</Text>
          <Text style={styles.tabSubtitle}>同点の場合は回答時間が短い順</Text>
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>まだランキングがありません</Text>
            <Text style={styles.emptyText}>最初の挑戦者になろう！</Text>
          </View>
        )
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContent}
    />
  );

  const renderPopularTab = () => (
    <FlatList
      data={popularTopics}
      renderItem={renderPopularTopicItem}
      keyExtractor={(item) => item.topic}
      ListHeaderComponent={
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>人気のお題 TOP100</Text>
          <Text style={styles.tabSubtitle}>挑戦者数が多い順</Text>
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>まだお題がありません</Text>
            <Text style={styles.emptyText}>最初に挑戦しよう！</Text>
          </View>
        )
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContent}
    />
  );

  const renderHistoryTab = () => {
    if (!user) {
      return (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptTitle}>ログインが必要です</Text>
          <Text style={styles.loginPromptText}>
            履歴を見るにはログインしてください
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>ログイン</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          stats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalGames}</Text>
                  <Text style={styles.statLabel}>挑戦数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {stats.averageScore}
                  </Text>
                  <Text style={styles.statLabel}>平均点</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FFD700' }]}>
                    {stats.bestScore}
                  </Text>
                  <Text style={styles.statLabel}>最高点</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.emptyLogo}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>まだ履歴がありません</Text>
              <Text style={styles.emptyText}>
                オオギリ検定に挑戦して{'\n'}履歴を残しましょう！
              </Text>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => navigation.navigate('Game')}
              >
                <Text style={styles.homeButtonText}>オオギリ検定へ</Text>
              </TouchableOpacity>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>ランキング</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ranking' && styles.tabActive]}
          onPress={() => setActiveTab('ranking')}
        >
          <Text style={[styles.tabText, activeTab === 'ranking' && styles.tabTextActive]}>
            TOP100
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.tabActive]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}>
            人気お題
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            履歴
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ranking' && renderRankingTab()}
      {activeTab === 'popular' && renderPopularTab()}
      {activeTab === 'history' && renderHistoryTab()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabHeader: {
    marginBottom: spacing.lg,
  },
  tabTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tabSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  // ランキングカード
  rankingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    ...shadows.sm,
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  rankingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rankingNickname: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  rankingTopic: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  rankingAnswer: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rankingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingTime: {
    ...typography.caption,
    color: colors.textLight,
  },
  challengeButton: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  challengeButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  // 人気お題カード
  popularCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  popularRank: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  popularCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  popularTopic: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  popularStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  popularStatItem: {
    alignItems: 'center',
  },
  popularStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  popularStatValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  challengeButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  challengeButtonLargeText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textInverse,
  },
  // 共通スタイル
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
  statsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    marginBottom: spacing.md,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textLight,
  },
  answerTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  topicText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  answerText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  commentText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  hintText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: '#FFF9E6',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyLogo: {
    width: 80,
    height: 80,
    marginBottom: spacing.xl,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loginPromptTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  loginPromptText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  loginButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textInverse,
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
