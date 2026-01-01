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
    backgroundColor: '#f5f5f5',
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  topicDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 12,
    color: '#999',
  },
  reactions: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  reactionBadgeActive: {
    backgroundColor: '#007AFF',
  },
  reactionText: {
    fontSize: 12,
    color: '#666',
  },
  reactionTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 8,
  },
  fabLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});
