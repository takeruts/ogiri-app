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
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

interface Topic {
  id: string;
  title: string;
  description: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  profiles: {
    username: string;
  };
  user_reaction?: 'like' | 'dislike' | null;
}

export const HomeScreen = ({ navigation }: any) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // 各お題に対するユーザーのリアクションを取得
      if (user && data) {
        const topicIds = data.map((t) => t.id);
        const { data: reactions } = await supabase
          .from('topic_reactions')
          .select('topic_id, reaction_type')
          .in('topic_id', topicIds)
          .eq('user_id', user.id);

        const reactionsMap = new Map(
          reactions?.map((r) => [r.topic_id, r.reaction_type]) || []
        );

        const topicsWithReactions = data.map((topic) => ({
          ...topic,
          user_reaction: reactionsMap.get(topic.id) || null,
        }));

        setTopics(topicsWithReactions);
      } else {
        setTopics(data || []);
      }
    } catch (error) {
      console.error('お題の取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopics();
  };

  const renderTopic = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.topicCard}
      onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
    >
      <Text style={styles.topicTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.topicDescription}>{item.description}</Text>
      )}
      <View style={styles.topicFooter}>
        <Text style={styles.username}>by {item.profiles.username}</Text>
        <View style={styles.reactions}>
          <View
            style={[
              styles.reactionBadge,
              item.user_reaction === 'like' && styles.reactionBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.reactionText,
                item.user_reaction === 'like' && styles.reactionTextActive,
              ]}
            >
              👍 {item.likes_count}
            </Text>
          </View>
          <View
            style={[
              styles.reactionBadge,
              item.user_reaction === 'dislike' && styles.reactionBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.reactionText,
                item.user_reaction === 'dislike' && styles.reactionTextActive,
              ]}
            >
              👎 {item.dislikes_count}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={topics}
        renderItem={renderTopic}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '読み込み中...' : 'お題がありません'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTopic')}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>お題を投稿</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topicCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  topicTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  topicDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  username: {
    ...typography.caption,
    color: colors.textLight,
  },
  reactions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reactionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reactionBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reactionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  reactionTextActive: {
    color: colors.textInverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.round,
    backgroundColor: colors.accent,
    ...shadows.lg,
  },
  fabIcon: {
    fontSize: 24,
    color: colors.textInverse,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  fabLabel: {
    ...typography.button,
    color: colors.textInverse,
  },
});
