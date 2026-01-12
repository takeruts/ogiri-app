import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { scorePhotoAnswer, ScoreResult } from '../services/geminiService';
import { getRandomPhoto, UnsplashPhoto, getPhotoCredit } from '../services/unsplashService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getNicknameInfo } from '../services/nicknameService';

type GamePhase = 'start' | 'loading' | 'answering' | 'scoring' | 'result';

export const PhotoGameScreen = ({ navigation }: any) => {
  const [phase, setPhase] = useState<GamePhase>('start');
  const [currentPhoto, setCurrentPhoto] = useState<UnsplashPhoto | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerTime, setAnswerTime] = useState<number | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [nicknameId, setNicknameId] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const { user } = useAuth();

  // 初回ロード時にニックネームを確認
  useEffect(() => {
    checkExistingNickname();
  }, [user]);

  const checkExistingNickname = async () => {
    try {
      if (user) {
        const info = await getNicknameInfo(user.id);
        if (info) {
          setNickname(info.nickname);
          setNicknameId(info.nicknameId);
        }
      } else {
        setNickname('ゲスト');
      }
    } catch (err) {
      console.error('ニックネーム確認エラー:', err);
      setNickname('ゲスト');
    }
  };

  // 結果をSupabaseに保存
  const saveResult = async (photo: UnsplashPhoto, userAnswer: string, scoreResult: ScoreResult, time: number | null) => {
    if (!user || !nicknameId) return;

    try {
      await supabase.from('game_history').insert({
        user_id: user.id,
        nickname_id: nicknameId,
        topic: `[写真で一言] ${photo.id}`,
        answer: userAnswer,
        score: scoreResult.score,
        comment: scoreResult.comment,
        hint: scoreResult.hint,
        answer_time: time,
      });
    } catch (err) {
      console.error('結果の保存に失敗:', err);
    }
  };

  const handleGetPhoto = async () => {
    setLoading(true);
    setError(null);
    setPhase('loading');
    try {
      const photo = await getRandomPhoto();
      setCurrentPhoto(photo);
      setPhase('answering');
      setAnswer('');
      setResult(null);
      setAnswerTime(null);
      startTimeRef.current = Date.now();
    } catch (err) {
      console.error('写真取得エラー:', err);
      setError('写真の取得に失敗しました。Unsplash APIキーを確認してください。');
      setPhase('start');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentPhoto) {
      setError('回答を入力してください');
      return;
    }

    const time = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : null;
    setAnswerTime(time);

    setLoading(true);
    setError(null);
    setPhase('scoring');

    try {
      const scoreResult = await scorePhotoAnswer(currentPhoto.url, answer);
      setResult(scoreResult);
      setPhase('result');
      await saveResult(currentPhoto, answer, scoreResult, time);
    } catch (err) {
      console.error('採点エラー:', err);
      setError('採点に失敗しました。もう一度お試しください。');
      setPhase('answering');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setAnswer('');
    setResult(null);
    setAnswerTime(null);
    startTimeRef.current = Date.now();
    setPhase('answering');
  };

  const handleNextPhoto = () => {
    handleGetPhoto();
  };

  const handleGoHome = () => {
    setPhase('start');
    setCurrentPhoto(null);
    setAnswer('');
    setResult(null);
    setError(null);
  };

  const handleShareToX = () => {
    if (!result || !currentPhoto) return;

    const emoji = getScoreEmoji(result.score);
    const text = `【壁打ちオオギリ - 写真で一言】${emoji} ${result.score}点！

回答：${answer}

💬 ${result.comment}

💡 ${result.hint}

AIと大喜利の練習ができる「壁打ちオオギリ」
あなたも挑戦してみよう！👇
https://www.ogirihub.com/

#壁打ちオオギリ #写真で一言 #大喜利 #AI採点`;

    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    Linking.openURL(twitterUrl);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#FFD700';
    if (score >= 60) return '#4CAF50';
    if (score >= 40) return '#2196F3';
    return '#FF5722';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎉';
    if (score >= 70) return '😄';
    if (score >= 50) return '😊';
    if (score >= 30) return '🤔';
    return '💪';
  };

  const renderStartScreen = () => (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>写真で一言</Text>
      <Text style={styles.subtitle}>Photo Ogiri</Text>
      <Text style={styles.description}>
        ランダムな写真に面白い一言を！{'\n'}
        AIが採点してくれます
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleGetPhoto}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.primaryButtonText}>写真を出す</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>通常モードに戻る</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingScreen = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>写真を探しています...</Text>
    </View>
  );

  const renderAnsweringScreen = () => (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoBadge}>
          <Text style={styles.photoBadgeText}>写真で一言</Text>
        </View>

        {currentPhoto && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: currentPhoto.url }}
              style={styles.photo}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => Linking.openURL(currentPhoto.photographerUrl)}
            >
              <Text style={styles.photoCredit}>
                📷 {currentPhoto.photographer} / Unsplash
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.phaseLabel}>あなたの一言</Text>
        <TextInput
          style={styles.answerInput}
          placeholder="この写真に一言..."
          placeholderTextColor={colors.textLight}
          value={answer}
          onChangeText={setAnswer}
          multiline
          maxLength={100}
        />
        <Text style={styles.charCount}>{answer.length}/100</Text>

        <TouchableOpacity
          style={[styles.primaryButton, !answer.trim() && styles.disabledButton]}
          onPress={handleSubmitAnswer}
          disabled={loading || !answer.trim()}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>採点する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleNextPhoto}>
          <Text style={styles.skipButtonText}>スキップして次の写真へ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>最初に戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderScoringScreen = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>AIが採点中...</Text>
      <Text style={styles.loadingSubtext}>写真を分析しています</Text>
    </View>
  );

  const renderResultScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.photoBadge}>
        <Text style={styles.photoBadgeText}>写真で一言</Text>
      </View>

      {currentPhoto && (
        <View style={styles.photoContainerSmall}>
          <Image
            source={{ uri: currentPhoto.url }}
            style={styles.photoSmall}
            resizeMode="contain"
          />
        </View>
      )}

      <Text style={styles.phaseLabel}>あなたの一言</Text>
      <View style={styles.answerCard}>
        <Text style={styles.answerText}>{answer}</Text>
      </View>

      {result && (
        <>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreEmoji}>{getScoreEmoji(result.score)}</Text>
            <Text style={[styles.scoreNumber, { color: getScoreColor(result.score) }]}>
              {result.score}
            </Text>
            <Text style={styles.scoreMax}>点</Text>
          </View>

          {answerTime !== null && (
            <Text style={styles.answerTimeText}>
              回答時間: {answerTime < 60 ? `${answerTime}秒` : `${Math.floor(answerTime / 60)}分${answerTime % 60}秒`}
            </Text>
          )}

          <View style={styles.commentCard}>
            <Text style={styles.commentLabel}>コメント</Text>
            <Text style={styles.commentText}>{result.comment}</Text>
          </View>

          <View style={styles.hintCard}>
            <Text style={styles.hintLabel}>💡 ヒント</Text>
            <Text style={styles.hintText}>{result.hint}</Text>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.shareButton} onPress={handleShareToX}>
        <Text style={styles.shareButtonText}>𝕏 で結果をシェア</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
          <Text style={styles.secondaryButtonText}>同じ写真で再挑戦</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNextPhoto}>
          <Text style={styles.primaryButtonText}>次の写真へ</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>最初に戻る</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backHeaderButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHeaderButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>写真で一言</Text>
        </View>
        {nickname ? (
          <Text style={styles.headerNickname}>{nickname}</Text>
        ) : (
          <View style={styles.headerNicknamePlaceholder} />
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {phase === 'start' && renderStartScreen()}
        {phase === 'loading' && renderLoadingScreen()}
        {phase === 'answering' && renderAnsweringScreen()}
        {phase === 'scoring' && renderScoringScreen()}
        {phase === 'result' && renderResultScreen()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  headerNickname: {
    ...typography.caption,
    color: colors.textSecondary,
    maxWidth: 70,
  },
  headerNicknamePlaceholder: {
    minWidth: 60,
  },
  backHeaderButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backHeaderButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  photoBadge: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  photoBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  photoContainer: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHover,
    ...shadows.md,
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceHover,
  },
  photoCredit: {
    ...typography.caption,
    color: colors.textLight,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  photoContainerSmall: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHover,
    ...shadows.sm,
  },
  photoSmall: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 180,
    backgroundColor: colors.surfaceHover,
  },
  phaseLabel: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  answerInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  charCount: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  answerCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  answerTimeText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  scoreEmoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  scoreMax: {
    ...typography.h2,
    color: colors.textLight,
  },
  commentCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  commentLabel: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  commentText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  hintCard: {
    backgroundColor: '#FFF9E6',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xxl,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  hintLabel: {
    ...typography.caption,
    color: '#B88A00',
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  hintText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
    lineHeight: 24,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
    lineHeight: 24,
  },
  disabledButton: {
    backgroundColor: colors.textLight,
  },
  shareButton: {
    backgroundColor: '#000000',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  skipButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  loadingText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xl,
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.error,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textInverse,
    flex: 1,
  },
  errorDismiss: {
    ...typography.h3,
    color: colors.textInverse,
    paddingHorizontal: spacing.md,
  },
  homeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 14,
    color: colors.textLight,
    textDecorationLine: 'underline',
  },
  backButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
