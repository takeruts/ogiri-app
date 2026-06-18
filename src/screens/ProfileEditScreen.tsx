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
import { useNicknameStatus } from '../hooks/useNicknameStatus';
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
  const nameStatus = useNicknameStatus(username, user?.id);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

      setUsername(data?.display_name || '');
      setEmail(user.email || '');
    } catch (error: any) {
      console.error('プロフィール取得エラー:', error);
      // エラーでも続行（新規ユーザーの場合）
      setEmail(user.email || '');
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      showAlert('エラー', 'ニックネームを入力してください');
      return;
    }

    setLoading(true);
    try {
      // まず既存のプロファイルがあるか確認
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user!.id)
        .single();

      if (existing) {
        // 既存のプロファイルを更新
        const { error } = await supabase
          .from('user_profiles')
          .update({
            display_name: username.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user!.id);

        if (error) throw error;
      } else {
        // 新規プロファイルを作成
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user!.id,
            display_name: username.trim()
          });

        if (error) throw error;
      }

      // nicknames テーブル（ランキング・マイページに表示される名前）も同期
      const newName = username.trim();
      const { data: takenRows } = await supabase
        .from('nicknames')
        .select('id, user_id')
        .ilike('nickname', newName)
        .limit(1);
      const taken = takenRows && takenRows[0];
      if (taken && taken.user_id !== user!.id) {
        showAlert('エラー', 'このニックネームは既に使われています。別の名前にしてください。');
        return;
      }
      const { data: nickRows } = await supabase
        .from('nicknames')
        .select('id')
        .eq('user_id', user!.id)
        .limit(1);
      if (nickRows && nickRows[0]) {
        await supabase.from('nicknames').update({ nickname: newName }).eq('id', nickRows[0].id);
      } else {
        await supabase.from('nicknames').insert({ nickname: newName, user_id: user!.id });
      }

      showAlert('成功', 'ニックネームを更新しました');
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
        {/* ニックネームセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ニックネーム</Text>
          <Text style={styles.helpText}>ランキングに表示される名前です</Text>
          <TextInput
            style={[
              styles.input,
              nameStatus === 'taken' && styles.inputError,
              nameStatus === 'available' && styles.inputOk,
            ]}
            placeholder="ニックネーム"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            maxLength={20}
          />
          {nameStatus === 'checking' && (
            <Text style={styles.statusChecking}>重複を確認中...</Text>
          )}
          {nameStatus === 'available' && (
            <Text style={styles.statusOk}>✓ このニックネームは使えます</Text>
          )}
          {nameStatus === 'taken' && (
            <Text style={styles.statusNg}>✗ このニックネームは既に使われています</Text>
          )}
          <TouchableOpacity
            style={[styles.button, (loading || nameStatus === 'taken') && styles.buttonDisabled]}
            onPress={handleUpdateUsername}
            disabled={loading || nameStatus === 'taken'}
          >
            <Text style={styles.buttonText}>ニックネームを更新</Text>
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
    marginBottom: spacing.sm,
  },
  helpText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  inputError: {
    borderColor: colors.error,
    marginBottom: spacing.xs,
  },
  inputOk: {
    borderColor: colors.success,
    marginBottom: spacing.xs,
  },
  statusChecking: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusOk: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statusNg: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
    marginBottom: spacing.md,
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
