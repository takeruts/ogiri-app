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
  Modal,
  Linking,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { generateTopic, scoreAnswer, scoreTopic, saveUserTopic, TOPIC_SCORE_THRESHOLD, ScoreResult, SCORING_CRITERIA, TopicResult, TopicScoreResult } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  getNicknameInfo,
  registerNickname,
} from '../services/nicknameService';

type GamePhase = 'nickname' | 'start' | 'generating' | 'answering' | 'scoring' | 'result';

interface ChallengeTopic {
  topic: string;
  source: 'random' | 'popular' | 'ranking';
}

export const GameScreen = ({ route, navigation }: any) => {
  const [phase, setPhase] = useState<GamePhase>('nickname');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentGenre, setCurrentGenre] = useState<string>('');
  const [isFallbackTopic, setIsFallbackTopic] = useState<boolean>(false);
  const [isUserSubmittedTopic, setIsUserSubmittedTopic] = useState<boolean>(false);
  const [topicSubmittedBy, setTopicSubmittedBy] = useState<string | undefined>();
  const [topicOriginalScore, setTopicOriginalScore] = useState<number | undefined>();
  const [answer, setAnswer] = useState<string>('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerTime, setAnswerTime] = useState<number | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [nicknameId, setNicknameId] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showTopicSubmitModal, setShowTopicSubmitModal] = useState(false);
  const [userTopicInput, setUserTopicInput] = useState('');
  const [topicScoreResult, setTopicScoreResult] = useState<TopicScoreResult | null>(null);
  const [topicScoring, setTopicScoring] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const { user, loading: authLoading } = useAuth();

  // ルートパラメータからお題を取得（ランキングや人気お題から挑戦する場合）
  const challengeTopic: ChallengeTopic | undefined = route?.params?.challengeTopic;

  // 初回ロード時にニックネームを確認
  useEffect(() => {
    // 認証状態の読み込みが完了するまで待つ
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    console.log('Auth loaded, checking nickname. user:', user?.id);
    checkExistingNickname();
  }, [user, authLoading]);

  const checkExistingNickname = async () => {
    setLoading(true);
    try {
      console.log('checkExistingNickname called, user:', user?.id, 'email:', user?.email);
      console.log('user_metadata:', JSON.stringify(user?.user_metadata, null, 2));

      // ログインユーザーの場合
      if (user) {
        // まずnicknamesテーブルを確認
        const info = await getNicknameInfo(user.id);
        if (info) {
          // ニックネームが既に登録されている場合、すぐにゲーム開始
          setNickname(info.nickname);
          setNicknameId(info.nicknameId);
          setPhase('start');
          return;
        }

        // nicknamesテーブルにない場合、各種ソースからニックネームを取得して登録
        let displayName: string | null = null;

        // 1. user_profilesテーブルから取得
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profile?.display_name) {
          displayName = profile.display_name;
        }

        // 2. profilesテーブルから取得
        if (!displayName) {
          const { data: profileOld } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

          if (profileOld?.username) {
            displayName = profileOld.username;
          }
        }

        // 3. auth.usersのメタデータから取得（メール登録時のnickname）
        if (!displayName && user.user_metadata?.nickname) {
          displayName = user.user_metadata.nickname;
          console.log('displayName from nickname:', displayName);
        }

        // 4. Googleログイン時の名前を取得
        if (!displayName && user.user_metadata?.full_name) {
          displayName = user.user_metadata.full_name;
          console.log('displayName from full_name:', displayName);
        }
        if (!displayName && user.user_metadata?.name) {
          displayName = user.user_metadata.name;
          console.log('displayName from name:', displayName);
        }

        // 5. メールアドレスからユーザー名を生成（最終手段）
        if (!displayName && user.email) {
          displayName = user.email.split('@')[0];
          console.log('displayName from email:', displayName);
        }

        console.log('Final displayName:', displayName);

        if (displayName) {
          // まず、同じニックネームが既にこのユーザーに紐づいているか確認
          const { data: existingNickname } = await supabase
            .from('nicknames')
            .select('id, nickname, user_id')
            .ilike('nickname', displayName)
            .limit(1)
            .single();

          if (existingNickname) {
            if (existingNickname.user_id === user.id) {
              // 既に自分のニックネームとして登録されている
              setNickname(existingNickname.nickname);
              setNicknameId(existingNickname.id);
              setPhase('start');
            } else if (!existingNickname.user_id) {
              // user_idがnullの場合（ゲストが使っていた）、このユーザーに紐付ける
              const { error: updateError } = await supabase
                .from('nicknames')
                .update({ user_id: user.id, device_id: null })
                .eq('id', existingNickname.id);

              if (!updateError) {
                setNickname(existingNickname.nickname);
                setNicknameId(existingNickname.id);
                setPhase('start');
              } else {
                // 更新に失敗した場合はプロフィール編集へ誘導
                setNicknameError('ニックネームが他のユーザーと重複しています。マイページから変更してください。');
                setPhase('nickname');
              }
            } else {
              // 他のユーザーが使っているニックネーム
              setNicknameError('ニックネームが他のユーザーと重複しています。マイページから変更してください。');
              setPhase('nickname');
            }
          } else {
            // ニックネームが存在しない場合は新規登録
            const result = await registerNickname(displayName, user.id);
            if (result.success && result.nicknameId) {
              setNickname(displayName);
              setNicknameId(result.nicknameId);
              setPhase('start');
            } else {
              // 登録に失敗した場合（重複など）はプロフィール編集へ誘導
              setNicknameError('ニックネームが他のユーザーと重複しています。マイページから変更してください。');
              setPhase('nickname');
            }
          }
        } else {
          // どこにもニックネームがない場合
          setNicknameError('マイページでニックネームを設定してください');
          setPhase('nickname');
        }
      } else {
        // 匿名ユーザーはニックネーム不要、すぐにゲーム開始
        setNickname('ゲスト');
        setNicknameId(null);
        setPhase('start');
      }
    } catch (err) {
      console.error('ニックネーム確認エラー:', err);
      // エラー時も匿名ユーザーはゲーム開始可能
      if (!user) {
        setNickname('ゲスト');
        setNicknameId(null);
        setPhase('start');
      } else {
        setPhase('nickname');
      }
    } finally {
      setLoading(false);
    }
  };

  // 結果をSupabaseに保存（ログインユーザーのみ）
  const saveResult = async (topic: string, userAnswer: string, scoreResult: ScoreResult, time: number | null) => {
    // ログインユーザーかつnicknameIdがある場合のみ保存
    if (!user || !nicknameId) return;

    try {
      await supabase.from('game_history').insert({
        user_id: user.id,
        nickname_id: nicknameId,
        topic: topic,
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

  const handleGenerateTopic = async () => {
    setLoading(true);
    setError(null);
    setPhase('generating');
    try {
      // チャレンジお題がある場合はそれを使用
      let topic: string;
      let genre: string = '';
      if (challengeTopic) {
        topic = challengeTopic.topic;
        // 使用後はクリア
        if (route?.params) {
          route.params.challengeTopic = undefined;
        }
      } else {
        const result = await generateTopic();
        topic = result.topic;
        genre = result.genre;
        setIsFallbackTopic(result.isFallback || false);
        setIsUserSubmittedTopic(result.isUserSubmitted || false);
        setTopicSubmittedBy(result.submittedBy);
        setTopicOriginalScore(result.topicScore);
      }
      setCurrentTopic(topic);
      setCurrentGenre(genre);
      if (challengeTopic) {
        setIsFallbackTopic(false);
        setIsUserSubmittedTopic(false);
        setTopicSubmittedBy(undefined);
        setTopicOriginalScore(undefined);
      }
      setPhase('answering');
      setAnswer('');
      setResult(null);
      setAnswerTime(null);
      startTimeRef.current = Date.now();
    } catch (err) {
      setError('お題の生成に失敗しました。もう一度お試しください。');
      setPhase('start');
    } finally {
      setLoading(false);
    }
  };

  // お題を採点する
  const handleScoreTopic = async () => {
    if (!userTopicInput.trim()) {
      return;
    }
    setTopicScoring(true);
    setTopicScoreResult(null);
    try {
      const result = await scoreTopic(userTopicInput.trim());
      setTopicScoreResult(result);
    } catch (err) {
      console.error('お題採点エラー:', err);
      setTopicScoreResult({
        score: 0,
        comment: '採点に失敗しました',
        suggestedGenre: 'その他',
      });
    } finally {
      setTopicScoring(false);
    }
  };

  // 高得点お題を保存（86点以上）
  const handleSaveUserTopic = async () => {
    if (!topicScoreResult || topicScoreResult.score < TOPIC_SCORE_THRESHOLD) {
      return;
    }
    await saveUserTopic(
      {
        topic: userTopicInput.trim(),
        genre: topicScoreResult.suggestedGenre,
      },
      nickname, // 投稿者のニックネーム
      topicScoreResult.score // お題のスコア
    );
    // モーダルを閉じてリセット
    setShowTopicSubmitModal(false);
    setUserTopicInput('');
    setTopicScoreResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('回答を入力してください');
      return;
    }

    const time = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : null;
    setAnswerTime(time);

    setLoading(true);
    setError(null);
    setPhase('scoring');

    try {
      const scoreResult = await scoreAnswer(currentTopic, answer);
      setResult(scoreResult);
      setPhase('result');
      await saveResult(currentTopic, answer, scoreResult, time);
    } catch (err) {
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

  const handleNextTopic = () => {
    handleGenerateTopic();
  };

  const handleGoHome = () => {
    setPhase('start');
    setCurrentTopic('');
    setAnswer('');
    setResult(null);
    setError(null);
  };

  const handleShareToX = () => {
    if (!result) return;

    const emoji = getScoreEmoji(result.score);
    const text = `${emoji}${result.score}点！

お題：${currentTopic}
回答：${answer}

#壁打ちオオギリ #大喜利
https://www.ogirihub.com/`;

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

  // ニックネーム設定画面（ログインユーザーでニックネーム未設定の場合のみ）
  const renderNicknameScreen = () => (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>壁打ちオオギリ</Text>
      <Text style={styles.subtitle}>ニックネームを設定してください</Text>
      <Text style={styles.description}>
        {nicknameError || 'マイページからニックネームを設定すると\nゲームを開始できます'}
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('MyPage')}
      >
        <Text style={styles.primaryButtonText}>マイページへ</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStartScreen = () => (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>壁打ちオオギリ</Text>
      <Text style={styles.welcomeText}>ようこそ、{nickname}さん！</Text>
      <Text style={styles.description}>
        お題を出す → 回答する → AIが採点{'\n'}
        大喜利の腕を磨こう！
      </Text>

      {!user ? (
        <TouchableOpacity
          style={styles.loginPrompt}
          onPress={() => navigation.navigate('MyPage')}
        >
          <Text style={styles.loginPromptText}>
            ログインすると履歴が残り、ランキングに参加できます
          </Text>
        </TouchableOpacity>
      ) : null}

      {challengeTopic && (
        <View style={styles.challengeTopicBanner}>
          <Text style={styles.challengeTopicLabel}>挑戦するお題</Text>
          <Text style={styles.challengeTopicText}>{challengeTopic.topic}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleGenerateTopic}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {challengeTopic ? 'このお題に挑戦' : 'テキスト大喜利'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.photoModeButton}
        onPress={() => navigation.navigate('PhotoGame')}
      >
        <Text style={styles.photoModeButtonText}>📷 写真で一言</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitTopicButton}
        onPress={() => setShowTopicSubmitModal(true)}
      >
        <Text style={styles.submitTopicButtonText}>✏️ お題を投稿する</Text>
      </TouchableOpacity>
    </View>
  );

  // お題投稿モーダル
  const renderTopicSubmitModal = () => (
    <Modal
      visible={showTopicSubmitModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowTopicSubmitModal(false);
        setUserTopicInput('');
        setTopicScoreResult(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.topicSubmitModalContent}>
          <Text style={styles.modalTitle}>お題を投稿</Text>
          <Text style={styles.topicSubmitDescription}>
            AIがお題を採点します。{TOPIC_SCORE_THRESHOLD}点以上でストックに追加されます！
          </Text>

          <TextInput
            style={styles.topicSubmitInput}
            placeholder="例: こんな医者は嫌だ。どんな医者？"
            value={userTopicInput}
            onChangeText={setUserTopicInput}
            multiline
            maxLength={100}
          />

          {!topicScoreResult ? (
            <TouchableOpacity
              style={[styles.primaryButton, (!userTopicInput.trim() || topicScoring) && styles.disabledButton]}
              onPress={handleScoreTopic}
              disabled={!userTopicInput.trim() || topicScoring}
            >
              {topicScoring ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.primaryButtonText}>採点する</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.topicScoreResultContainer}>
              <View style={[
                styles.topicScoreBadge,
                topicScoreResult.score >= TOPIC_SCORE_THRESHOLD ? styles.highScoreBadge : styles.lowScoreBadge
              ]}>
                <Text style={styles.topicScoreText}>{topicScoreResult.score}点</Text>
              </View>
              <View style={styles.topicScoreCommentBox}>
                <Text style={styles.topicScoreCommentLabel}>採点理由</Text>
                <Text style={styles.topicScoreComment}>{topicScoreResult.comment || '（コメントなし）'}</Text>
              </View>
              <Text style={styles.topicScoreGenre}>ジャンル: {topicScoreResult.suggestedGenre}</Text>

              {topicScoreResult.score >= TOPIC_SCORE_THRESHOLD ? (
                <TouchableOpacity
                  style={styles.saveTopicButton}
                  onPress={handleSaveUserTopic}
                >
                  <Text style={styles.saveTopicButtonText}>ストックに追加する</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.lowScoreHint}>
                  {TOPIC_SCORE_THRESHOLD}点以上でストックに追加できます。お題を改善してみましょう！
                </Text>
              )}

              <TouchableOpacity
                style={styles.retryTopicButton}
                onPress={() => {
                  setTopicScoreResult(null);
                }}
              >
                <Text style={styles.retryTopicButtonText}>別のお題を入力</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => {
              setShowTopicSubmitModal(false);
              setUserTopicInput('');
              setTopicScoreResult(null);
            }}
          >
            <Text style={styles.closeModalButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAnsweringScreen = () => (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topicHeader}>
          <Text style={styles.phaseLabel}>お題</Text>
          <View style={styles.badgeRow}>
            {currentGenre ? (
              <View style={styles.genreBadge}>
                <Text style={styles.genreBadgeText}>{currentGenre}</Text>
              </View>
            ) : null}
            {isUserSubmittedTopic ? (
              <View style={styles.userSubmittedBadge}>
                <Text style={styles.userSubmittedBadgeText}>投稿</Text>
              </View>
            ) : isFallbackTopic ? (
              <View style={styles.fallbackBadge}>
                <Text style={styles.fallbackBadgeText}>ストック</Text>
              </View>
            ) : currentTopic ? (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.topicCardSmall}>
          <Text style={styles.topicTextSmall}>{currentTopic}</Text>
          {isUserSubmittedTopic && topicSubmittedBy && (
            <Text style={styles.topicSubmitterInfo}>
              投稿: {topicSubmittedBy} ({topicOriginalScore}点)
            </Text>
          )}
        </View>

        <Text style={styles.phaseLabel}>あなたの回答</Text>
        <TextInput
          style={styles.answerInput}
          placeholder="面白い回答を入力..."
          placeholderTextColor={colors.textLight}
          value={answer}
          onChangeText={setAnswer}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{answer.length}/200</Text>

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

        <TouchableOpacity style={styles.skipButton} onPress={handleNextTopic}>
          <Text style={styles.skipButtonText}>スキップして次のお題へ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>最初に戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderGeneratingScreen = () => (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.generatingLogo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={colors.primary} style={styles.generatingSpinner} />
      <Text style={styles.loadingText}>お題を考え中...</Text>
      <Text style={styles.loadingSubtext}>AIがお題を生成しています</Text>
    </View>
  );

  const renderScoringScreen = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>AIが採点中...</Text>
      <Text style={styles.loadingSubtext}>少々お待ちください</Text>
    </View>
  );

  const renderResultScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.topicHeader}>
        <Text style={styles.phaseLabel}>お題</Text>
        <View style={styles.badgeRow}>
          {currentGenre ? (
            <View style={styles.genreBadge}>
              <Text style={styles.genreBadgeText}>{currentGenre}</Text>
            </View>
          ) : null}
          {isUserSubmittedTopic ? (
            <View style={styles.userSubmittedBadge}>
              <Text style={styles.userSubmittedBadgeText}>投稿</Text>
            </View>
          ) : isFallbackTopic ? (
            <View style={styles.fallbackBadge}>
              <Text style={styles.fallbackBadgeText}>ストック</Text>
            </View>
          ) : currentTopic ? (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.topicCardSmall}>
        <Text style={styles.topicTextSmall}>{currentTopic}</Text>
        {isUserSubmittedTopic && topicSubmittedBy && (
          <Text style={styles.topicSubmitterInfo}>
            投稿: {topicSubmittedBy} ({topicOriginalScore}点)
          </Text>
        )}
      </View>

      <Text style={styles.phaseLabel}>あなたの回答</Text>
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

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
          <Text style={styles.secondaryButtonText}>同じお題で再挑戦</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNextTopic}>
          <Text style={styles.primaryButtonText}>次のお題へ</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShareToX}>
        <Text style={styles.shareButtonText}>𝕏 でシェア</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>最初に戻る</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 採点基準モーダル
  const renderCriteriaModal = () => (
    <Modal
      visible={showCriteriaModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCriteriaModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCriteriaModal(false)}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{SCORING_CRITERIA.title}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCriteriaModal(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>{SCORING_CRITERIA.description}</Text>

          <View style={styles.criteriaList}>
            {SCORING_CRITERIA.criteria.map((item, index) => (
              <View key={index} style={styles.criteriaItem}>
                <View style={styles.criteriaHeader}>
                  <Text style={styles.criteriaName}>{item.name}</Text>
                  <Text style={styles.criteriaWeight}>{item.weight}</Text>
                </View>
                <Text style={styles.criteriaDescription}>{item.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>高得点のコツ</Text>
            {SCORING_CRITERIA.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ローディング中
  if (loading && phase === 'nickname') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>壁打ちオオギリ</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.criteriaButton}
          onPress={() => setShowCriteriaModal(true)}
        >
          <Text style={styles.criteriaButtonText}>採点基準</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>壁打ちオオギリ</Text>
        </View>
        {nickname && phase !== 'nickname' ? (
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
        {phase === 'nickname' && renderNicknameScreen()}
        {phase === 'start' && renderStartScreen()}
        {phase === 'generating' && renderGeneratingScreen()}
        {phase === 'answering' && renderAnsweringScreen()}
        {phase === 'scoring' && renderScoringScreen()}
        {phase === 'result' && renderResultScreen()}
      </View>

      {renderCriteriaModal()}
      {renderTopicSubmitModal()}
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
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerNickname: {
    ...typography.caption,
    color: colors.textSecondary,
    maxWidth: 70,
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
    width: 120,
    height: 120,
    marginBottom: spacing.xl,
  },
  generatingLogo: {
    width: 80,
    height: 80,
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  generatingSpinner: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  welcomeText: {
    ...typography.h3,
    color: colors.secondary,
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
  challengeTopicBanner: {
    backgroundColor: colors.primarySoft,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    width: '100%',
  },
  challengeTopicLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  challengeTopicText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  phaseLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  genreBadge: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.round,
  },
  genreBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  fallbackBadge: {
    backgroundColor: colors.textLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.round,
  },
  fallbackBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  aiBadge: {
    backgroundColor: '#8B5CF6',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.round,
  },
  aiBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  userSubmittedBadge: {
    backgroundColor: '#10B981',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.round,
  },
  userSubmittedBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  topicCardSmall: {
    backgroundColor: colors.primarySoft,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    width: '100%',
  },
  topicTextSmall: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 24,
  },
  topicSubmitterInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  answerInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    minHeight: 120,
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
    backgroundColor: colors.primary,
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
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 24,
  },
  photoModeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  photoModeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    lineHeight: 22,
  },
  disabledButton: {
    backgroundColor: colors.textLight,
  },
  shareButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    alignSelf: 'center',
  },
  shareButtonText: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'underline',
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
  loginPrompt: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loginPromptText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  criteriaButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
  },
  criteriaButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerNicknamePlaceholder: {
    minWidth: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.primary,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  criteriaList: {
    marginBottom: spacing.lg,
  },
  criteriaItem: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  criteriaName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  criteriaWeight: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  criteriaDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tipsSection: {
    backgroundColor: '#FFF9E6',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    color: '#B88A00',
    marginBottom: spacing.sm,
  },
  tipItem: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  // お題投稿関連のスタイル
  submitTopicButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  submitTopicButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  topicSubmitModalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    maxWidth: 400,
    width: '100%',
    ...shadows.lg,
  },
  topicSubmitDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  topicSubmitInput: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  topicScoreResultContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  topicScoreBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
  },
  highScoreBadge: {
    backgroundColor: '#10B981',
  },
  lowScoreBadge: {
    backgroundColor: colors.textLight,
  },
  topicScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  topicScoreCommentBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  topicScoreCommentLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  topicScoreComment: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  topicScoreGenre: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  saveTopicButton: {
    backgroundColor: '#10B981',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  saveTopicButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
  lowScoreHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  retryTopicButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryTopicButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  closeModalButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  closeModalButtonText: {
    ...typography.body,
    color: colors.textLight,
  },
});
