import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ウェブとモバイルの両方で動作する確認ダイアログ
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: onConfirm },
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

type TabType = 'topics' | 'answers' | 'users';

interface Topic {
  id: string;
  title: string;
  description: string | null;
  profiles: { username: string };
  created_at: string;
}

interface Answer {
  id: string;
  content: string;
  profiles: { username: string };
  topics: { title: string };
  created_at: string;
}

interface User {
  id: string;
  username: string;
  created_at: string;
  is_admin: boolean;
}

export const AdminScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('topics');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const checkAdminAccess = async () => {
    if (!user) {
      showAlert('エラー', 'ログインが必要です');
      navigation.goBack();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!data.is_admin) {
        showAlert('アクセス拒否', '管理者のみアクセス可能です');
        navigation.goBack();
      }
    } catch (error) {
      console.error('管理者確認エラー:', error);
      navigation.goBack();
    }
  };

  const fetchData = async () => {
    try {
      if (activeTab === 'topics') {
        const { data, error } = await supabase
          .from('topics')
          .select('id, title, description, created_at, profiles(username)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTopics(data || []);
      } else if (activeTab === 'answers') {
        const { data, error } = await supabase
          .from('answers')
          .select('id, content, created_at, profiles(username), topics(title)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnswers(data || []);
      } else if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, created_at, is_admin')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    showConfirm(
      '確認',
      `お題「${title}」を削除しますか？`,
      async () => {
        try {
          const { error } = await supabase
            .from('topics')
            .delete()
            .eq('id', topicId);

          if (error) throw error;

          showAlert('成功', 'お題を削除しました');
          fetchData();
        } catch (error: any) {
          showAlert('削除エラー', error.message);
        }
      }
    );
  };

  const handleDeleteAnswer = async (answerId: string) => {
    showConfirm(
      '確認',
      'この回答を削除しますか？',
      async () => {
        try {
          const { error } = await supabase
            .from('answers')
            .delete()
            .eq('id', answerId);

          if (error) throw error;

          showAlert('成功', '回答を削除しました');
          fetchData();
        } catch (error: any) {
          showAlert('削除エラー', error.message);
        }
      }
    );
  };

  const handleBanUser = async (userId: string, username: string) => {
    showConfirm(
      '確認',
      `ユーザー「${username}」のアカウントを無効化しますか？\n（投稿したお題と回答も削除されます）`,
      async () => {
        try {
          // プロフィールを削除（CASCADE で関連データも削除される）
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (error) throw error;

          showAlert('成功', 'ユーザーを無効化しました');
          fetchData();
        } catch (error: any) {
          showAlert('無効化エラー', error.message);
        }
      }
    );
  };

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        <Text style={styles.itemMeta}>
          投稿者: {item.profiles.username} | {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTopic(item.id, item.title)}
      >
        <Text style={styles.deleteButtonText}>削除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAnswerItem = ({ item }: { item: Answer }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.itemContent}>{item.content}</Text>
        <Text style={styles.itemMeta}>
          お題: {item.topics.title}
        </Text>
        <Text style={styles.itemMeta}>
          投稿者: {item.profiles.username} | {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteAnswer(item.id)}
      >
        <Text style={styles.deleteButtonText}>削除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>
          {item.username}
          {item.is_admin && <Text style={styles.adminBadge}> [管理者]</Text>}
        </Text>
        <Text style={styles.itemMeta}>
          登録日: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      {!item.is_admin && (
        <TouchableOpacity
          style={[styles.deleteButton, styles.banButton]}
          onPress={() => handleBanUser(item.id, item.username)}
        >
          <Text style={styles.deleteButtonText}>無効化</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getFilteredData = () => {
    if (!searchQuery) {
      if (activeTab === 'topics') return topics;
      if (activeTab === 'answers') return answers;
      if (activeTab === 'users') return users;
    }

    const query = searchQuery.toLowerCase();
    if (activeTab === 'topics') {
      return topics.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.profiles.username.toLowerCase().includes(query)
      );
    }
    if (activeTab === 'answers') {
      return answers.filter(
        (a) =>
          a.content.toLowerCase().includes(query) ||
          a.profiles.username.toLowerCase().includes(query)
      );
    }
    if (activeTab === 'users') {
      return users.filter((u) => u.username.toLowerCase().includes(query));
    }
    return [];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>管理者画面</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'topics' && styles.activeTab]}
          onPress={() => setActiveTab('topics')}
        >
          <Text style={[styles.tabText, activeTab === 'topics' && styles.activeTabText]}>
            お題
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'answers' && styles.activeTab]}
          onPress={() => setActiveTab('answers')}
        >
          <Text style={[styles.tabText, activeTab === 'answers' && styles.activeTabText]}>
            回答
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            ユーザー
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={getFilteredData()}
        renderItem={
          activeTab === 'topics'
            ? renderTopicItem
            : activeTab === 'answers'
            ? renderAnswerItem
            : renderUserItem
        }
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  itemMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  adminBadge: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  banButton: {
    backgroundColor: '#ff9500',
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
});
