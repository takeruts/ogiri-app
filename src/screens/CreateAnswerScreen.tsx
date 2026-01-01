import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const CreateAnswerScreen = ({ route, navigation }: any) => {
  const { topicId } = route.params;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('エラー', '回答を入力してください');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    setLoading(true);
    try {
      // 既存の回答数をチェック
      const { data: existingAnswers, error: countError } = await supabase
        .from('answers')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', user.id);

      if (countError) throw countError;

      if (existingAnswers && existingAnswers.length >= 3) {
        Alert.alert('エラー', '一つのお題に対して最大3つまで回答できます');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('answers').insert({
        topic_id: topicId,
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      Alert.alert('成功', '回答を投稿しました');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('投稿エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.label}>あなたの回答 *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="面白い回答を考えよう！"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          maxLength={500}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '投稿中...' : '回答を投稿'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
