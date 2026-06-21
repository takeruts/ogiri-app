import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
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
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>オオギリ検定</Text>
      </View>
      {!user ? (
        <TouchableOpacity
          style={styles.loginPrompt}
          onPress={() => navigation.navigate('MyPage')}
        >
          <Text style={styles.loginPromptText}>
            ログインすると履歴が残り、ランキングに参加できます
          </Text>
        </TouchableOpacity>
      ) : null}
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
        onPress={() => {
          if (!user) {
            navigation.navigate('MyPage');
          } else {
            navigation.navigate('CreateTopic');
          }
        }}
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
  header: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  loginPrompt: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    ...shadows.sm,
  },
  loginPromptText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
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
    flexShrink: 1,
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
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    backgroundColor: colors.accent,
    ...shadows.lg,
  },
  fabIcon: {
    fontSize: 16,
    color: colors.textInverse,
    fontWeight: 'bold',
    marginRight: spacing.xs,
    lineHeight: 16,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    lineHeight: 16,
  },
});
