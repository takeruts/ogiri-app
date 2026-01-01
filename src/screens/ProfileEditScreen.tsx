import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

// ウェブとモバイルの両方で動作するアラート
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// ウェブとモバイルの両方で動作する確認ダイアログ
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'OK', onPress: onConfirm },
    ]);
  }
};

export const ProfileEditScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUsername(data.username || '');
      setEmail(user.email || '');
    } catch (error: any) {
      console.error('プロフィール取得エラー:', error);
      showAlert('エラー', 'プロフィール情報の取得に失敗しました');
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      showAlert('エラー', 'ユーザー名を入力してください');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user!.id);

      if (error) throw error;

      showAlert('成功', 'ユーザー名を更新しました');
    } catch (error: any) {
      showAlert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      showAlert('エラー', 'メールアドレスを入力してください');
      return;
    }

    if (email === user?.email) {
      showAlert('エラー', '現在のメールアドレスと同じです');
      return;
    }

    showConfirm(
      'メールアドレス変更',
      '新しいメールアドレスに確認メールが送信されます。メール内のリンクをクリックして変更を完了してください。',
      async () => {
        setLoading(true);
        try {
          const { error } = await supabase.auth.updateUser({
            email: email.trim(),
          });

          if (error) throw error;

          showAlert('確認メール送信', '新しいメールアドレスに確認メールを送信しました');
          setEmail(user?.email || '');
        } catch (error: any) {
          showAlert('エラー', error.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('エラー', 'すべてのパスワード欄を入力してください');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('エラー', '新しいパスワードは6文字以上で入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('エラー', '新しいパスワードが一致しません');
      return;
    }

    setLoading(true);
    try {
      // 現在のパスワードで再認証
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('現在のパスワードが正しくありません');
      }

      // パスワード更新
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showAlert('成功', 'パスワードを更新しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showAlert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        {/* ユーザー名セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ユーザー名</Text>
          <TextInput
            style={styles.input}
            placeholder="ユーザー名"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdateUsername}
            disabled={loading}
          >
            <Text style={styles.buttonText}>ユーザー名を更新</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* メールアドレスセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メールアドレス</Text>
          <Text style={styles.currentEmail}>現在: {user?.email}</Text>
          <TextInput
            style={styles.input}
            placeholder="新しいメールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdateEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>メールアドレスを変更</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* パスワード変更セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>パスワード変更</Text>

          <Text style={styles.label}>現在のパスワード</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="現在のパスワード"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Text style={styles.eyeText}>
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>新しいパスワード</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="新しいパスワード（6文字以上）"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Text style={styles.eyeText}>
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>新しいパスワード（確認）</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="新しいパスワード（確認）"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeText}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>パスワードを変更</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  currentEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.lg,
    ...typography.body,
  },
  eyeButton: {
    padding: spacing.lg,
  },
  eyeText: {
    fontSize: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xxl,
  },
});
