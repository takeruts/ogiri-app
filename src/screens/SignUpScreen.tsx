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
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

export const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const { signUp } = useAuth();

  // すべての項目が入力されているかチェック
  const isFormValid = nickname.trim() && email.trim() && password && confirmPassword;

  const handleSignUp = async () => {
    if (!isFormValid) {
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, nickname);
      setIsRegistered(true);
    } catch (error: any) {
      Alert.alert('登録エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 登録完了後のメール確認画面
  if (isRegistered) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>壁打ちオオギリ</Text>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>確認メールを送信しました</Text>
            <Text style={styles.successMessage}>
              {email} に確認メールを送信しました。{'\n\n'}
              メール内のリンクをクリックして{'\n'}
              登録を完了してください。
            </Text>
            <Text style={styles.successNote}>
              ※ メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>壁打ちオオギリ</Text>
        <Text style={styles.subtitle}>新規登録</Text>

        <TextInput
          style={styles.input}
          placeholder="ニックネーム"
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="パスワード (6文字以上)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="パスワード確認"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || !isFormValid) && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading || !isFormValid}
        >
          <Text style={styles.buttonText}>
            {loading ? '登録中...' : '登録'}
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    padding: spacing.xxl,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  subtitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    color: colors.textSecondary,
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
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  successCard: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  successMessage: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  successNote: {
    ...typography.bodySmall,
    color: colors.textLight,
    textAlign: 'center',
  },
});
