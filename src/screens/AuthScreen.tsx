import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {isLogin ? <LoginScreen /> : <SignUpScreen />}

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchText}>
          {isLogin ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Game')}
      >
        <Text style={styles.homeButtonText}>壁打ちオオギリへ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  switchButton: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  switchText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  homeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xxl,
    alignSelf: 'center',
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
