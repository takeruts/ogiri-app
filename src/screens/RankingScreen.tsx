import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

type RankingType = 'answers' | 'topics';

interface RankingItem {
  id: string;
  title?: string;
  content?: string;
  likes_count: number;
  dislikes_count: number;
  profiles: {
    username: string;
  };
}

export const RankingScreen = ({ navigation }: any) => {
  const [rankingType, setRankingType] = useState<RankingType>('answers');
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    try {
      if (rankingType === 'answers') {
        const { data, error } = await supabase
          .from('answers')
          .select('*, profiles(username), topics(title)')
          .order('likes_count', { ascending: false })
          .limit(100);

        if (error) throw error;
        setItems(data || []);
      } else {
        const { data, error } = await supabase
          .from('topics')
          .select('*, profiles(username)')
          .order('likes_count', { ascending: false })
          .limit(100);

        if (error) throw error;
        setItems(data || []);
      }
    } catch (error) {
      console.error('ランキング取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [rankingType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRanking();
  };

  // ランク → 称号・色・絵文字
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { emoji: '👑', label: '殿堂入り', color: '#FBBF24' };
    if (rank === 2) return { emoji: '🥈', label: '天才', color: '#CBD5E1' };
    if (rank === 3) return { emoji: '🥉', label: '天才', color: '#F59E0B' };
    if (rank <= 10) return { emoji: '🔥', label: '天才', color: colors.accent };
    if (rank <= 30) return { emoji: '⭐', label: '秀才', color: colors.primary };
    return { emoji: '✨', label: '実力派', color: colors.primaryDark };
  };

  const renderItem = ({ item, index }: { item: RankingItem; index: number }) => {
    const rank = index + 1;
    const r = getRankStyle(rank);
    const isTop3 = rank <= 3;
    const badgeTextColor = isTop3 ? '#1B1030' : '#fff';
    return (
      <TouchableOpacity
        style={[styles.itemCard, isTop3 && { borderColor: r.color }]}
        onPress={() => {
          if (rankingType === 'answers') {
            navigation.navigate('AnswerDetail', { answerId: item.id });
          } else {
            navigation.navigate('TopicDetail', { topicId: item.id });
          }
        }}
      >
        <View style={[styles.rankBadge, { backgroundColor: r.color }]}>
          <Text style={styles.rankEmoji}>{r.emoji}</Text>
          <Text style={[styles.rankText, { color: badgeTextColor }]}>{rank}</Text>
        </View>
        <View style={styles.itemContent}>
          <View style={[styles.titleChip, { borderColor: r.color }]}>
            <Text style={[styles.titleChipText, { color: r.color }]}>{r.label}</Text>
          </View>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {rankingType === 'answers' ? item.content : item.title}
          </Text>
          <View style={styles.itemFooter}>
            <Text style={styles.username}>by {item.profiles.username}</Text>
            <View style={styles.reactions}>
              <Text style={styles.reactionText}>👍 {item.likes_count}</Text>
              <Text style={styles.reactionText}>👎 {item.dislikes_count}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rankHeader}>
        <Text style={styles.rankHeaderTitle}>今週の天才 TOP100</Text>
        <Text style={styles.rankHeaderSub}>みんなのお笑いセンスをランキング</Text>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, rankingType === 'answers' && styles.tabActive]}
          onPress={() => setRankingType('answers')}
        >
          <Text
            style={[
              styles.tabText,
              rankingType === 'answers' && styles.tabTextActive,
            ]}
          >
            回答ランキング
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, rankingType === 'topics' && styles.tabActive]}
          onPress={() => setRankingType('topics')}
        >
          <Text
            style={[
              styles.tabText,
              rankingType === 'topics' && styles.tabTextActive,
            ]}
          >
            お題ランキング
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '読み込み中...' : 'データがありません'}
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
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rankHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  rankHeaderTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1,
  },
  rankHeaderSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rankBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    ...shadows.sm,
  },
  rankEmoji: {
    fontSize: 18,
    lineHeight: 20,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  itemContent: {
    flex: 1,
  },
  titleChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  titleChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  username: {
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
