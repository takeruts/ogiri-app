import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Answer {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  profiles: {
    username: string;
  };
  user_reaction?: 'like' | 'dislike' | null;
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  likes_count: number;
  dislikes_count: number;
  profiles: {
    username: string;
  };
}

export const TopicDetailScreen = ({ route, navigation }: any) => {
  const { topicId } = route.params;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const { user } = useAuth();

  const fetchTopic = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*, profiles(username)')
        .eq('id', topicId)
        .single();

      if (error) throw error;
      setTopic(data);
    } catch (error) {
      console.error('お題の取得エラー:', error);
    }
  };

  const fetchAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('id, user_id, content, likes_count, dislikes_count, created_at, profiles(username)')
        .eq('topic_id', topicId)
        .order('likes_count', { ascending: false });

      if (error) throw error;

      // 各回答に対するユーザーのリアクションを取得
      if (user && data) {
        const answerIds = data.map((a) => a.id);
        const { data: reactions } = await supabase
          .from('answer_reactions')
          .select('answer_id, reaction_type')
          .in('answer_id', answerIds)
          .eq('user_id', user.id);

        const reactionsMap = new Map(
          reactions?.map((r) => [r.answer_id, r.reaction_type]) || []
        );

        const answersWithReactions = data.map((answer) => ({
          ...answer,
          user_reaction: reactionsMap.get(answer.id) || null,
        }));

        setAnswers(answersWithReactions);
      } else {
        setAnswers(data || []);
      }
    } catch (error) {
      console.error('回答の取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserReaction = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('topic_reactions')
        .select('reaction_type')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserReaction(data?.reaction_type || null);
    } catch (error) {
      console.error('リアクションの取得エラー:', error);
    }
  };

  useEffect(() => {
    fetchTopic();
    fetchAnswers();
    fetchUserReaction();
  }, [topicId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopic();
    fetchAnswers();
    fetchUserReaction();
  };

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    try {
      if (userReaction === reactionType) {
        // 同じリアクションをクリック = 削除
        const { error } = await supabase
          .from('topic_reactions')
          .delete()
          .eq('topic_id', topicId)
          .eq('user_id', user.id);

        if (error) throw error;
        setUserReaction(null);
      } else {
        // 異なるリアクションまたは新規
        if (userReaction) {
          // 既存のリアクションがある場合は、まず削除
          await supabase
            .from('topic_reactions')
            .delete()
            .eq('topic_id', topicId)
            .eq('user_id', user.id);
        }

        // 新しいリアクションを挿入
        const { error } = await supabase
          .from('topic_reactions')
          .insert({
            topic_id: topicId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
        setUserReaction(reactionType);
      }

      fetchTopic();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    Alert.alert(
      '確認',
      'この回答を削除しますか?',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('answers')
                .delete()
                .eq('id', answerId);

              if (error) throw error;

              Alert.alert('成功', '回答を削除しました');
              fetchAnswers();
            } catch (error: any) {
              Alert.alert('削除エラー', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAnswerReaction = async (
    answerId: string,
    reactionType: 'like' | 'dislike',
    currentReaction: 'like' | 'dislike' | null | undefined
  ) => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    try {
      if (currentReaction === reactionType) {
        // 同じリアクションをクリック = 削除
        const { error } = await supabase
          .from('answer_reactions')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // 異なるリアクションまたは新規
        if (currentReaction) {
          // 既存のリアクションがある場合は、まず削除
          await supabase
            .from('answer_reactions')
            .delete()
            .eq('answer_id', answerId)
            .eq('user_id', user.id);
        }

        // 新しいリアクションを挿入
        const { error } = await supabase
          .from('answer_reactions')
          .insert({
            answer_id: answerId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
      }

      fetchAnswers();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  const renderAnswer = ({ item }: { item: Answer }) => {
    const isOwnAnswer = user && item.user_id === user.id;

    return (
      <View style={styles.answerCard}>
        <Text style={styles.answerContent}>{item.content}</Text>
        <View style={styles.answerFooter}>
          <Text style={styles.username}>by {item.profiles.username}</Text>
          <View style={styles.answerReactionButtons}>
            <TouchableOpacity
              style={[
                styles.answerReactionButton,
                item.user_reaction === 'like' && styles.reactionButtonActive,
              ]}
              onPress={() => handleAnswerReaction(item.id, 'like', item.user_reaction)}
            >
              <Text
                style={[
                  styles.answerReactionText,
                  item.user_reaction === 'like' && styles.reactionTextActive,
                ]}
              >
                👍 {item.likes_count}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.answerReactionButton,
                item.user_reaction === 'dislike' && styles.reactionButtonActive,
              ]}
              onPress={() => handleAnswerReaction(item.id, 'dislike', item.user_reaction)}
            >
              <Text
                style={[
                  styles.answerReactionText,
                  item.user_reaction === 'dislike' && styles.reactionTextActive,
                ]}
              >
                👎 {item.dislikes_count}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {isOwnAnswer && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAnswer(item.id)}
          >
            <Text style={styles.deleteButtonText}>削除</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!topic) {
    return (
      <View style={styles.loadingContainer}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={answers}
        renderItem={renderAnswer}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            {topic.image_url && (
              <Image source={{ uri: topic.image_url }} style={styles.topicImage} />
            )}
            {topic.description && (
              <Text style={styles.topicDescription}>{topic.description}</Text>
            )}
            <View style={styles.topicFooter}>
              <Text style={styles.username}>by {topic.profiles.username}</Text>
              <View style={styles.reactionButtons}>
                <TouchableOpacity
                  style={[
                    styles.reactionButton,
                    userReaction === 'like' && styles.reactionButtonActive,
                  ]}
                  onPress={() => handleReaction('like')}
                >
                  <Text style={styles.reactionButtonText}>
                    👍 {topic.likes_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reactionButton,
                    userReaction === 'dislike' && styles.reactionButtonActive,
                  ]}
                  onPress={() => handleReaction('dislike')}
                >
                  <Text style={styles.reactionButtonText}>
                    👎 {topic.dislikes_count}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.answersTitle}>回答一覧</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '読み込み中...' : 'まだ回答がありません'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAnswer', { topicId })}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>回答する</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  topicTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  topicImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  topicDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 12,
    color: '#999',
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  reactionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  reactionButtonActive: {
    backgroundColor: '#007AFF',
  },
  reactionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  answerCard: {
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
  answerContent: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  reactions: {
    flexDirection: 'row',
    gap: 10,
  },
  reactionText: {
    fontSize: 12,
    color: '#666',
  },
  answerReactionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  answerReactionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  answerReactionText: {
    fontSize: 12,
    color: '#333',
  },
  reactionTextActive: {
    color: '#fff',
  },
  deleteButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#ff3b30',
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
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
