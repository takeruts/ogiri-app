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
          .limit(50);

        if (error) throw error;
        setItems(data || []);
      } else {
        const { data, error } = await supabase
          .from('topics')
          .select('*, profiles(username)')
          .order('likes_count', { ascending: false })
          .limit(50);

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

  const renderItem = ({ item, index }: { item: RankingItem; index: number }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => {
        if (rankingType === 'answers') {
          navigation.navigate('AnswerDetail', { answerId: item.id });
        } else {
          navigation.navigate('TopicDetail', { topicId: item.id });
        }
      }}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <View style={styles.itemContent}>
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

  return (
    <View style={styles.container}>
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
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
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
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  itemFooter: {
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
    gap: 10,
  },
  reactionText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
