import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';
import { colors, spacing, typography } from '../constants/theme';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);

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
});
