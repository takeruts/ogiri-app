import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

// Supabaseエラーメッセージを日本語に変換
const getErrorMessage = (error: any): string => {
  const message = error?.message || 'エラーが発生しました';

  // よくあるエラーメッセージを日本語に変換
  if (message.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません';
  }
  if (message.includes('Email not confirmed')) {
    return 'メールアドレスの確認が完了していません。確認メールをご確認ください';
  }
  if (message.includes('User not found')) {
    return 'このメールアドレスは登録されていません';
  }
  if (message.includes('Too many requests')) {
    return 'ログイン試行回数が多すぎます。しばらくしてからお試しください';
  }
  if (message.includes('Network')) {
    return 'ネットワークエラーが発生しました。接続を確認してください';
  }
  if (message.includes('popup')) {
    return 'ポップアップがブロックされました。ポップアップを許可してください';
  }

  return message;
};

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.ogirihub.com/',
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセットメール送信完了画面
  if (resetSent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>オオギリ検定</Text>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>リセットメールを送信しました</Text>
            <Text style={styles.successMessage}>
              {email} にパスワードリセット用の{'\n'}
              メールを送信しました。{'\n\n'}
              メール内のリンクをクリックして{'\n'}
              新しいパスワードを設定してください。
            </Text>
            <Text style={styles.successNote}>
              ※ メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setResetSent(false);
              setIsResetMode(false);
            }}
          >
            <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // パスワードリセット画面
  if (isResetMode) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>オオギリ検定</Text>
          <Text style={styles.subtitle}>パスワードをリセット</Text>
          <Text style={styles.description}>
            登録したメールアドレスを入力してください。{'\n'}
            パスワードリセット用のリンクを送信します。
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.button, (loading || !email.trim()) && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading || !email.trim()}
          >
            <Text style={styles.buttonText}>
              {loading ? '送信中...' : 'リセットメールを送信'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsResetMode(false)}
          >
            <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>オオギリ検定</Text>
        <Text style={styles.subtitle}>ログイン</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

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
            placeholder="パスワード"
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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => setIsResetMode(true)}
        >
          <Text style={styles.forgotButtonText}>パスワードを忘れた方はこちら</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Googleでログイン</Text>
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
  forgotButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  forgotButtonText: {
    ...typography.bodySmall,
    color: colors.textLight,
    textDecorationLine: 'underline',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  backButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textLight,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: spacing.md,
  },
  googleButtonText: {
    ...typography.button,
    color: colors.text,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    textAlign: 'center',
  },
});
