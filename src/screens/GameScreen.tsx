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
import { colors, spacing, borderRadius, typography, shadows, diag } from '../constants/theme';
import { generateTopic, getDailyTopic, scoreAnswer, scoreTopic, saveUserTopic, TOPIC_SCORE_THRESHOLD, ScoreResult, SCORING_CRITERIA, TopicResult, TopicScoreResult } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateResultImage, shareOrDownloadImage } from '../utils/shareImage';
import { logEvent } from '../utils/analytics';
import { getTimeBonus } from '../utils/scoring';
import {
  getNicknameInfo,
  registerNickname,
  getStoredNickname,
  storeNickname,
} from '../services/nicknameService';

type GamePhase = 'nickname' | 'start' | 'generating' | 'answering' | 'scoring' | 'result' | 'diagnosisResult';

// 総合診断で連続回答するお題数
const DIAG_COUNT = 3;

interface DiagEntry {
  topic: string;
  answer: string;
  result: ScoreResult;
}

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
  const [guestName, setGuestName] = useState<string>(''); // 未ログイン時のランキング表示名
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showTopicSubmitModal, setShowTopicSubmitModal] = useState(false);
  const [userTopicInput, setUserTopicInput] = useState('');
  const [topicScoreResult, setTopicScoreResult] = useState<TopicScoreResult | null>(null);
  const [topicScoring, setTopicScoring] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [diagMode, setDiagMode] = useState(false); // 総合診断モード（複数お題）
  const [diagResults, setDiagResults] = useState<DiagEntry[]>([]);
  const [examStats, setExamStats] = useState<{
    deviation: number;
    rankName: string;
    topPercent: number;
    nationalRank: number | null;
    totalUsers: number | null;
    games: number;
  } | null>(null);
  const [examCategory, setExamCategory] = useState<'text' | 'speed' | 'idea'>('text');
  const [dailyTopic, setDailyTopic] = useState<TopicResult | null>(null);
  const [dailyCount, setDailyCount] = useState<number | null>(null);
  const [speedLeft, setSpeedLeft] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const submitRef = useRef<() => void>(() => {});
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

  // スタート画面に戻るたびに段位（受験成績）と今日の検定を取得
  useEffect(() => {
    if (phase === 'start') {
      fetchUserStats();
      fetchDaily();
    }
  }, [phase, user]);

  // 最新の回答送信ハンドラを参照に保持（タイマーから安全に呼ぶため）
  useEffect(() => {
    submitRef.current = () => {
      if (answer.trim()) {
        handleSubmitAnswer();
      } else {
        setError('時間切れ！次はスピード勝負で');
        handleGoHome();
      }
    };
  });

  // 瞬発力検定の制限時間（回答中のみカウントダウン）
  useEffect(() => {
    if (phase === 'answering' && examCategory === 'speed') {
      setSpeedLeft(60);
      const id = setInterval(() => {
        setSpeedLeft((s) => {
          if (s === null) return s;
          if (s <= 1) {
            clearInterval(id);
            submitRef.current();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
    setSpeedLeft(null);
    return undefined;
  }, [phase, examCategory]);

  // 今日の検定（日替わりお題＋本日の受験者数）
  const fetchDaily = async () => {
    const t = getDailyTopic();
    setDailyTopic(t);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('game_history')
        .select('id', { count: 'exact', head: true })
        .eq('topic', t.topic)
        .gte('created_at', start.toISOString());
      setDailyCount(count ?? 0);
    } catch (e) {
      setDailyCount(null);
    }
  };

  // ユーザーの段位・偏差値・全国順位を集計
  const fetchUserStats = async () => {
    if (!user) {
      setExamStats(null);
      return;
    }
    try {
      // 段位・偏差値は履歴の積み重ねを使いつつ、直近の点数を重くする加重平均
      const { data: hist } = await supabase
        .from('game_history')
        .select('score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!hist || hist.length === 0) {
        setExamStats(null);
        return;
      }
      // 直近ほど重み大（1回さかのぼるごとに0.9倍）。過去も少しずつ反映＝積み重ね
      const DECAY = 0.9;
      let weightSum = 0;
      let scoreSum = 0;
      let w = 1;
      for (const row of hist) {
        scoreSum += Number(row.score) * w;
        weightSum += w;
        w *= DECAY;
      }
      const weightedAvg = scoreSum / weightSum;
      const deviation = getDeviation(weightedAvg);

      // 全国順位・総受験回数は全期間（user_rankings）から
      let nationalRank: number | null = null;
      let totalUsers: number | null = null;
      let games = hist.length;
      const { data: rankRows } = await supabase
        .from('user_rankings')
        .select('average_score, total_games')
        .eq('user_id', user.id)
        .limit(1);
      const myRank = rankRows && rankRows[0];
      if (myRank) {
        games = myRank.total_games;
        const allAvg = Number(myRank.average_score);
        const [{ count: above }, { count: total }] = await Promise.all([
          supabase.from('user_rankings').select('user_id', { count: 'exact', head: true }).gt('average_score', allAvg),
          supabase.from('user_rankings').select('user_id', { count: 'exact', head: true }),
        ]);
        nationalRank = (above ?? 0) + 1;
        totalUsers = total ?? null;
      }

      setExamStats({
        deviation,
        rankName: getRank(deviation),
        topPercent: getTopPercent(weightedAvg),
        nationalRank,
        totalUsers,
        games,
      });
    } catch (e) {
      console.error('段位の取得に失敗:', e);
      setExamStats(null);
    }
  };

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
        const stored = await getStoredNickname();
        setNickname(stored || 'ゲスト');
        setGuestName(stored || '');
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

  // ゲスト（未ログイン）の表示名からニックネームIDを確保する
  const ensureGuestNickname = async (name: string): Promise<string | null> => {
    const trimmed = (name || '').trim() || 'ゲスト';
    await storeNickname(trimmed);
    // このデバイスの既存ニックネームが同名ならそれを使う
    const existing = await getNicknameInfo();
    if (existing && existing.nickname.toLowerCase() === trimmed.toLowerCase()) {
      return existing.nicknameId;
    }
    // 新規登録を試みる
    const res = await registerNickname(trimmed);
    if (res.success && res.nicknameId) return res.nicknameId;
    // 既に使われている名前なら、その表示名のIDを共有して使う
    try {
      const { data } = await supabase
        .from('nicknames')
        .select('id')
        .ilike('nickname', trimmed)
        .limit(1)
        .single();
      if (data?.id) return data.id;
    } catch (e) {
      // フォールスルー
    }
    return existing?.nicknameId ?? null;
  };

  // 結果をSupabaseに保存（ログインユーザー＋名前を入力したゲスト）
  const saveResult = async (topic: string, userAnswer: string, scoreResult: ScoreResult, time: number | null) => {
    // ログイン済みでニックネーム未設定の場合のみスキップ
    if (user && !nicknameId) return;

    try {
      // ゲストは入力された表示名でニックネームIDを確保
      const nid = user ? nicknameId : await ensureGuestNickname(guestName);

      await supabase.from('game_history').insert({
        user_id: user?.id ?? null,
        nickname_id: nid,
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
      // 回答時間をスコアに反映（スピードボーナス）
      const bonus = getTimeBonus(time, examCategory);
      scoreResult.baseScore = scoreResult.score;
      scoreResult.timeBonus = bonus;
      scoreResult.score = Math.max(0, Math.min(100, scoreResult.score + bonus));
      logEvent('diagnose_complete', {
        score: scoreResult.score,
        deviation: getDeviation(scoreResult.score),
        top_percent: getTopPercent(scoreResult.score),
        diag_type: getDiagType(scoreResult, getAxes(scoreResult, answer)),
        genre: currentGenre || undefined,
        mode: diagMode ? 'diagnosis' : 'single',
      });
      await saveResult(currentTopic, answer, scoreResult, time);
      setResult(scoreResult);

      if (diagMode) {
        const newResults = [...diagResults, { topic: currentTopic, answer, result: scoreResult }];
        setDiagResults(newResults);
        if (newResults.length >= DIAG_COUNT) {
          setPhase('diagnosisResult');
          logEvent('diagnosis_finished', { count: newResults.length });
        } else {
          // 次のお題へ（診断継続）
          await handleGenerateTopic();
        }
      } else {
        setPhase('result');
      }
    } catch (err) {
      setError('採点に失敗しました。もう一度お試しください。');
      setPhase('answering');
    } finally {
      setLoading(false);
    }
  };

  // 総合診断を開始（複数お題に連続回答）
  const handleStartDiagnosis = async () => {
    setExamCategory('text');
    setDiagMode(true);
    setDiagResults([]);
    await handleGenerateTopic();
  };

  // 瞬発力検定（1問・制限時間つき）
  const handleStartSpeed = async () => {
    setExamCategory('speed');
    setDiagMode(false);
    await handleGenerateTopic();
  };

  // 普通の大喜利採点（1問・じっくり）
  const handleStartIdea = async () => {
    setExamCategory('idea');
    setDiagMode(false);
    await handleGenerateTopic();
  };

  // 今日の検定（日替わりお題を受験）
  const handleStartDaily = () => {
    if (!dailyTopic) return;
    setExamCategory('text');
    setDiagMode(false);
    setCurrentTopic(dailyTopic.topic);
    setCurrentGenre(dailyTopic.genre);
    setIsFallbackTopic(true);
    setIsUserSubmittedTopic(false);
    setTopicSubmittedBy(undefined);
    setTopicOriginalScore(undefined);
    setAnswer('');
    setResult(null);
    setAnswerTime(null);
    startTimeRef.current = Date.now();
    setPhase('answering');
  };

  // 診断結果の集計
  const computeDiagnosis = (entries: DiagEntry[]) => {
    const n = entries.length || 1;
    const avgScore = Math.round(entries.reduce((s, e) => s + e.result.score, 0) / n);
    const axesList = entries.map((e) => getAxes(e.result, e.answer));
    const avgAxis = (k: 'creativity' | 'sarcasm' | 'surreal' | 'empathy') =>
      Math.max(1, Math.min(5, Math.round(axesList.reduce((s, a) => s + a[k], 0) / n)));
    const axes = {
      creativity: avgAxis('creativity'),
      sarcasm: avgAxis('sarcasm'),
      surreal: avgAxis('surreal'),
      empathy: avgAxis('empathy'),
    };
    const type = getDiagType({ score: avgScore, comment: '', hint: '', axes } as ScoreResult, axes);
    return {
      count: entries.length,
      avgScore,
      axes,
      deviation: getDeviation(avgScore),
      topPercent: getTopPercent(avgScore),
      type,
    };
  };

  // 総合評価コメント
  const getOverallComment = (score: number) => {
    if (score >= 80) return 'もはやプロ級。あなたのボケは生まれ持った才能です。';
    if (score >= 65) return 'かなりの実力派。大喜利の場を任せられるセンス。';
    if (score >= 50) return '平均以上のお笑いセンス。あと一歩で爆笑ハンター。';
    if (score >= 35) return '伸びしろの塊。ひらめきを磨けば一気に化けます。';
    return 'これからが本番。場数を踏んでセンスを開花させよう。';
  };

  // 総合診断の短い称号（シェア画像用）
  const getOverallTagline = (score: number) => {
    if (score >= 80) return '天才クラス';
    if (score >= 65) return '実力派';
    if (score >= 50) return '平均以上';
    if (score >= 35) return '伸びしろ大';
    return 'これから型';
  };

  // 総合診断結果を画像で保存／シェア
  const handleSaveDiagnosisImage = async () => {
    if (savingImage || diagResults.length === 0) return;
    setSavingImage(true);
    try {
      const dg = computeDiagnosis(diagResults);
      const blob = await generateResultImage({
        deviation: dg.deviation,
        topPercent: dg.topPercent,
        type: dg.type,
        axes: [
          { label: '創造力', value: dg.axes.creativity },
          { label: '毒舌力', value: dg.axes.sarcasm },
          { label: 'シュール力', value: dg.axes.surreal },
          { label: '共感力', value: dg.axes.empathy },
        ],
        analysis: getOverallTagline(dg.avgScore),
        topic: getRank(dg.deviation),
        answer: `「${dg.type}」`,
        topicLabel: 'オオギリ検定 認定段位',
        answerLabel: 'お笑いタイプ',
        analysisTitle: 'CERTIFICATE',
        analysisPrefix: '総合評価は',
      });
      if (blob) {
        const outcome = await shareOrDownloadImage(blob, 'owarai-shindan.png');
        logEvent('share', { method: 'image', kind: 'diagnosis', outcome, score: dg.avgScore });
      } else {
        setError('画像の保存はWeb版で利用できます');
      }
    } catch (e) {
      console.error('診断画像生成エラー:', e);
      setError('画像の生成に失敗しました');
    } finally {
      setSavingImage(false);
    }
  };

  const handleShareDiagnosisX = () => {
    if (diagResults.length === 0) return;
    const dg = computeDiagnosis(diagResults);
    const text = `📜オオギリ検定 認定証
認定段位：${getRank(dg.deviation)}
お笑い偏差値 ${dg.deviation}（全国上位${dg.topPercent}%）
タイプ：${dg.type}
${getOverallComment(dg.avgScore)}

#オオギリ検定 #大喜利
https://www.ogirihub.com/`;
    logEvent('share', { method: 'x_text', kind: 'diagnosis', score: dg.avgScore });
    Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
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
    setDiagMode(false);
    setDiagResults([]);
    setExamCategory('text');
    setSpeedLeft(null);
  };

  const handleShareToX = () => {
    if (!result) return;

    const dev = getDeviation(result.score);
    const top = getTopPercent(result.score);
    const axes = getAxes(result, answer);
    const dtype = getDiagType(result, axes);
    const text = `🎤お笑い偏差値 ${dev}（全国上位${top}%）
タイプ：${dtype}

お題：${currentTopic}
回答：${answer}

#オオギリ検定 #大喜利
https://www.ogirihub.com/`;

    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

    logEvent('share', { method: 'x_text', score: result.score });
    Linking.openURL(twitterUrl);
  };

  // 診断結果を縦長カード画像にして保存／シェア
  const handleSaveImage = async () => {
    if (!result || savingImage) return;
    setSavingImage(true);
    try {
      const axes = getAxes(result, answer);
      const blob = await generateResultImage({
        deviation: getDeviation(result.score),
        topPercent: getTopPercent(result.score),
        type: getDiagType(result, axes),
        axes: [
          { label: '創造力', value: axes.creativity },
          { label: '毒舌力', value: axes.sarcasm },
          { label: 'シュール力', value: axes.surreal },
          { label: '共感力', value: axes.empathy },
        ],
        analysis: getAnalysis(result),
        topic: currentTopic,
        answer,
      });
      if (blob) {
        const outcome = await shareOrDownloadImage(blob, 'owarai-hensachi.png');
        logEvent('share', { method: 'image', outcome, score: result.score });
      } else {
        setError('画像の保存はWeb版で利用できます');
      }
    } catch (e) {
      console.error('画像生成エラー:', e);
      setError('画像の生成に失敗しました');
    } finally {
      setSavingImage(false);
    }
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

  // ===== お笑いセンス診断ロジック =====
  // 点数 → お笑い偏差値（0→40, 100→75）
  const getDeviation = (score: number) => Math.round(40 + score * 0.35);

  // 点数 → 全国上位パーセント
  const getTopPercent = (score: number) => {
    if (score >= 95) return 1;
    if (score >= 90) return 3;
    if (score >= 85) return 5;
    if (score >= 80) return 8;
    if (score >= 75) return 12;
    if (score >= 70) return 18;
    if (score >= 65) return 25;
    if (score >= 60) return 33;
    if (score >= 50) return 45;
    if (score >= 40) return 60;
    if (score >= 30) return 75;
    return 88;
  };

  // 偏差値 → 段位（オオギリ検定の認定段位）
  const getRank = (deviation: number): string => {
    if (deviation >= 74) return '名人';
    if (deviation >= 71) return '五段';
    if (deviation >= 68) return '四段';
    if (deviation >= 65) return '三段';
    if (deviation >= 62) return '二段';
    if (deviation >= 59) return '初段';
    if (deviation >= 56) return '一級';
    if (deviation >= 53) return '二級';
    if (deviation >= 50) return '三級';
    if (deviation >= 45) return '四級';
    if (deviation >= 40) return '五級';
    return '級外';
  };

  // 文字列ハッシュ（軸のばらつきを決定的に出す）
  const hashStr = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  // 4軸スコア（AIが返せばそれを使い、無ければ点数＋回答から決定的に生成）
  const getAxes = (r: ScoreResult, ans: string): { creativity: number; sarcasm: number; surreal: number; empathy: number } => {
    if (r.axes) return r.axes;
    const base = Math.max(1, Math.min(5, Math.round(r.score / 20)));
    const h = hashStr(ans + r.score);
    const vary = (shift: number) => {
      const d = ((h >> shift) & 3) - 1; // -1〜2
      return Math.max(1, Math.min(5, base + d));
    };
    return { creativity: vary(0), sarcasm: vary(2), surreal: vary(4), empathy: vary(6) };
  };

  // お笑いタイプ（AI優先 → 最も高い軸から命名）
  const getDiagType = (r: ScoreResult, axes: { creativity: number; sarcasm: number; surreal: number; empathy: number }) => {
    if (r.type) return r.type;
    if (r.score < 40) return 'これから伸びる原石型';
    const entries: [string, number][] = [
      ['天才ひらめき型', axes.creativity],
      ['毒舌キレ型', axes.sarcasm],
      ['シュール天才型', axes.surreal],
      ['共感マスター型', axes.empathy],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  // Wrapped 風の一言分析
  const getAnalysis = (r: ScoreResult) =>
    r.analysis || (r.score >= 70 ? '予測不能度MAX' : r.score >= 45 ? '安定感のあるボケ' : '伸びしろ無限大');

  // AI審査員キャラ（点数で出し分け）
  const getJudge = (score: number) => {
    if (score >= 70) return { name: 'ラナ', tag: '天才系AI', color: diag.purple };
    if (score >= 45) return { name: 'モモ', tag: '共感系AI', color: diag.pink };
    return { name: 'ミュー', tag: '毒舌系AI', color: '#F59E0B' };
  };

  // ニックネーム設定画面（ログインユーザーでニックネーム未設定の場合のみ）
  const renderNicknameScreen = () => (
    <View style={styles.centerContent}>
      <Text style={styles.title}>オオギリ検定</Text>
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
    <ScrollView contentContainerStyle={styles.startContent}>
      <Text style={styles.title}>オオギリ検定</Text>

      {examStats ? (
        <View style={styles.rankCard}>
          <Text style={styles.rankCardLabel}>あなたの認定段位</Text>
          <Text style={styles.rankCardDan}>{examStats.rankName}</Text>
          <View style={styles.rankCardRow}>
            <View style={styles.rankCardStat}>
              <Text style={styles.rankStatValue}>{examStats.deviation}</Text>
              <Text style={styles.rankStatLabel}>偏差値</Text>
            </View>
            <View style={styles.rankCardDivider} />
            <View style={styles.rankCardStat}>
              <Text style={styles.rankStatValue}>
                {examStats.nationalRank ? `${examStats.nationalRank}位` : `上位${examStats.topPercent}%`}
              </Text>
              <Text style={styles.rankStatLabel}>
                {examStats.totalUsers ? `全国${examStats.totalUsers}人中` : '全国順位'}
              </Text>
            </View>
            <View style={styles.rankCardDivider} />
            <View style={styles.rankCardStat}>
              <Text style={styles.rankStatValue}>{examStats.games}</Text>
              <Text style={styles.rankStatLabel}>受験回数</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.heroCopy}>AIがあなたの発想力を測定し、{'\n'}段位と偏差値を認定。</Text>
          <Text style={styles.heroSub}>受験 → 採点 → 認定 → 昇段</Text>
          <Text style={styles.welcomeText}>ようこそ、{nickname}さん！</Text>
          {user ? (
            <Text style={styles.description}>受験するとあなたの段位が認定されます</Text>
          ) : null}
        </>
      )}

      {!user ? (
        <TouchableOpacity
          style={styles.loginPrompt}
          onPress={() => navigation.navigate('MyPage')}
        >
          <Text style={styles.loginPromptText}>
            ログインすると段位が認定され、全国ランキングに参加できます
          </Text>
        </TouchableOpacity>
      ) : null}

      {challengeTopic && (
        <View style={styles.challengeTopicBanner}>
          <Text style={styles.challengeTopicLabel}>挑戦するお題</Text>
          <Text style={styles.challengeTopicText}>{challengeTopic.topic}</Text>
        </View>
      )}

      {challengeTopic ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGenerateTopic}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>このお題で受験</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          {dailyTopic && (
            <TouchableOpacity style={styles.dailyBanner} onPress={handleStartDaily} disabled={loading}>
              <View style={styles.dailyBannerHeader}>
                <Text style={styles.dailyBannerLabel}>📅 本日の検定</Text>
                <Text style={styles.dailyBannerCount}>受験者 {dailyCount ?? '—'}人</Text>
              </View>
              <Text style={styles.dailyBannerTopic} numberOfLines={2}>{dailyTopic.topic}</Text>
              <Text style={styles.dailyBannerCta}>タップして受験 →</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.categoryHeading}>検定カテゴリ</Text>
          <View style={styles.categoryGrid}>
            <TouchableOpacity
              style={[styles.catCard, styles.catCardPrimary]}
              onPress={handleStartDiagnosis}
              disabled={loading}
            >
              <Text style={styles.catEmoji}>📝</Text>
              <Text style={styles.catTitle}>大喜利検定</Text>
              <Text style={styles.catSub}>総合{DIAG_COUNT}問・段位認定</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catCard} onPress={handleStartSpeed} disabled={loading}>
              <Text style={styles.catEmoji}>⚡</Text>
              <Text style={styles.catTitle}>瞬発力検定</Text>
              <Text style={styles.catSub}>制限時間60秒・速さ重視</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catCard} onPress={handleStartIdea} disabled={loading}>
              <Text style={styles.catEmoji}>✏️</Text>
              <Text style={styles.catTitle}>普通の大喜利採点</Text>
              <Text style={styles.catSub}>1問・じっくり採点</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catCard} onPress={() => navigation.navigate('PhotoGame')}>
              <Text style={styles.catEmoji}>📷</Text>
              <Text style={styles.catTitle}>写真で一言</Text>
              <Text style={styles.catSub}>画像にボケる</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.submitTopicButton}
        onPress={() => setShowTopicSubmitModal(true)}
      >
        <Text style={styles.submitTopicButtonText}>✏️ お題を投稿する</Text>
      </TouchableOpacity>
    </ScrollView>
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
        {examCategory === 'speed' && speedLeft !== null && (
          <View style={[styles.speedTimer, speedLeft <= 10 && styles.speedTimerWarn]}>
            <Text style={styles.speedTimerLabel}>⚡ 瞬発力検定・制限時間</Text>
            <Text style={[styles.speedTimerValue, speedLeft <= 10 && styles.speedTimerValueWarn]}>
              {speedLeft}秒
            </Text>
          </View>
        )}
        {diagMode && (
          <View style={styles.diagProgress}>
            <Text style={styles.diagProgressText}>
              総合診断 {diagResults.length + 1} / {DIAG_COUNT} 問目
            </Text>
            <View style={styles.diagProgressBar}>
              <View
                style={[
                  styles.diagProgressFill,
                  { width: `${(diagResults.length / DIAG_COUNT) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
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

        {!user && (
          <>
            <Text style={styles.phaseLabel}>ニックネーム（ランキング表示名）</Text>
            <TextInput
              style={styles.guestNameInput}
              placeholder="ゲスト"
              placeholderTextColor={colors.textLight}
              value={guestName}
              onChangeText={setGuestName}
              maxLength={20}
            />
          </>
        )}

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

      {result && (() => {
        const dev = getDeviation(result.score);
        const top = getTopPercent(result.score);
        const axes = getAxes(result, answer);
        const dtype = getDiagType(result, axes);
        const judge = getJudge(result.score);
        const analysis = getAnalysis(result);
        const axisList = [
          { label: '創造力', value: axes.creativity },
          { label: '毒舌力', value: axes.sarcasm },
          { label: 'シュール力', value: axes.surreal },
          { label: '共感力', value: axes.empathy },
        ];
        return (
          <View style={styles.diagCard}>
            <Text style={styles.diagLabel}>お笑い偏差値</Text>
            <Text style={styles.diagDeviation}>{dev}</Text>
            <View style={styles.diagTopPill}>
              <Text style={styles.diagTopPillText}>全国上位 {top}%</Text>
            </View>

            <Text style={styles.diagTypeLabel}>あなたは</Text>
            <Text style={styles.diagType}>「{dtype}」</Text>

            <View style={styles.diagAxes}>
              {axisList.map((a) => (
                <View key={a.label} style={styles.axisRow}>
                  <Text style={styles.axisLabel}>{a.label}</Text>
                  <Text style={styles.axisStars}>
                    <Text style={styles.axisStarOn}>{'★'.repeat(a.value)}</Text>
                    <Text style={styles.axisStarOff}>{'☆'.repeat(5 - a.value)}</Text>
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.wrappedCard}>
              <Text style={styles.wrappedLabel}>AI ANALYSIS</Text>
              <Text style={styles.wrappedText}>あなたの回答は{'\n'}{analysis}</Text>
            </View>

            <View style={styles.judgeRow}>
              <View style={[styles.judgeAvatar, { backgroundColor: judge.color }]}>
                <Text style={styles.judgeAvatarText}>{judge.name.charAt(0)}</Text>
              </View>
              <View style={styles.judgeBubble}>
                <Text style={[styles.judgeName, { color: judge.color }]}>{judge.name}・{judge.tag}</Text>
                <Text style={styles.judgeComment}>{result.comment}</Text>
              </View>
            </View>

            <View style={styles.diagHint}>
              <Text style={styles.diagHintText}>💡 {result.hint}</Text>
            </View>

            {answerTime !== null && (
              <Text style={styles.diagTime}>
                回答時間 {answerTime < 60 ? `${answerTime}秒` : `${Math.floor(answerTime / 60)}分${answerTime % 60}秒`}
                {result.timeBonus !== undefined && result.baseScore !== undefined
                  ? `　AI ${result.baseScore}点 ＋スピード ${result.timeBonus >= 0 ? '+' : ''}${result.timeBonus}点`
                  : ''}
              </Text>
            )}
          </View>
        );
      })()}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
          <Text style={styles.secondaryButtonText}>同じお題で再挑戦</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNextTopic}>
          <Text style={styles.primaryButtonText}>次のお題へ</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.neonShareButton} onPress={handleSaveImage} disabled={savingImage}>
        {savingImage ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.neonShareButtonText}>📸 診断結果を画像で保存・シェア</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.xShareButton} onPress={handleShareToX}>
        <Text style={styles.xShareButtonText}>𝕏 でテキスト投稿</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>最初に戻る</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 総合診断の結果画面
  const renderDiagnosisResult = () => {
    const dg = computeDiagnosis(diagResults);
    const axisList = [
      { label: '創造力', value: dg.axes.creativity },
      { label: '毒舌力', value: dg.axes.sarcasm },
      { label: 'シュール力', value: dg.axes.surreal },
      { label: '共感力', value: dg.axes.empathy },
    ];
    const rankName = getRank(dg.deviation);
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.diagResultHeader}>オオギリ検定 認定証</Text>
        <Text style={styles.diagResultSub}>全{dg.count}問の受験結果を認定</Text>

        <View style={styles.certCard}>
          <Text style={styles.certBrand}>OOGIRI CERTIFICATE</Text>
          <Text style={styles.certRankLabel}>認定段位</Text>
          <Text style={styles.certRankDan}>{rankName}</Text>

          <View style={styles.certDivider} />

          <Text style={styles.diagLabel}>総合お笑い偏差値</Text>
          <Text style={styles.diagDeviation}>{dg.deviation}</Text>
          <View style={styles.diagTopPill}>
            <Text style={styles.diagTopPillText}>全国上位 {dg.topPercent}%</Text>
          </View>

          <Text style={styles.diagTypeLabel}>あなたのお笑いタイプは</Text>
          <Text style={styles.diagType}>「{dg.type}」</Text>

          <View style={styles.diagAxes}>
            {axisList.map((a) => (
              <View key={a.label} style={styles.axisRow}>
                <Text style={styles.axisLabel}>{a.label}</Text>
                <Text style={styles.axisStars}>
                  <Text style={styles.axisStarOn}>{'★'.repeat(a.value)}</Text>
                  <Text style={styles.axisStarOff}>{'☆'.repeat(5 - a.value)}</Text>
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.wrappedCard}>
            <Text style={styles.wrappedLabel}>総合評価</Text>
            <Text style={styles.wrappedText}>{getOverallComment(dg.avgScore)}</Text>
          </View>
        </View>

        <Text style={styles.diagBreakdownTitle}>回答の内訳</Text>
        {diagResults.map((e, i) => (
          <View key={i} style={styles.diagBreakItem}>
            <View style={styles.diagBreakHeader}>
              <Text style={styles.diagBreakNum}>Q{i + 1}</Text>
              <Text style={styles.diagBreakScore}>偏差値 {getDeviation(e.result.score)}</Text>
            </View>
            <Text style={styles.diagBreakTopic} numberOfLines={2}>{e.topic}</Text>
            <Text style={styles.diagBreakAnswer} numberOfLines={2}>{e.answer}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.neonShareButton}
          onPress={handleSaveDiagnosisImage}
          disabled={savingImage}
        >
          {savingImage ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.neonShareButtonText}>📸 診断結果を画像で保存・シェア</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.xShareButton} onPress={handleShareDiagnosisX}>
          <Text style={styles.xShareButtonText}>𝕏 でテキスト投稿</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleStartDiagnosis}>
            <Text style={styles.secondaryButtonText}>もう一度診断</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

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

        </View>
      </TouchableOpacity>
    </Modal>
  );

  // 高得点のコツモーダル
  const renderTipsModal = () => (
    <Modal
      visible={showTipsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTipsModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowTipsModal(false)}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💡 高得点のコツ</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTipsModal(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsSection}>
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
            source={require('../../assets/logo-wide.png')}
            style={styles.headerBanner}
            resizeMode="contain"
          />
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
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.criteriaButton}
            onPress={() => setShowCriteriaModal(true)}
          >
            <Text style={styles.criteriaButtonText}>採点基準</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.criteriaButton}
            onPress={() => setShowTipsModal(true)}
          >
            <Text style={styles.criteriaButtonText}>💡コツ</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Image
            source={require('../../assets/logo-wide.png')}
            style={styles.headerBanner}
            resizeMode="contain"
          />
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
        {phase === 'diagnosisResult' && renderDiagnosisResult()}
      </View>

      {renderCriteriaModal()}
      {renderTipsModal()}
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
    flex: 1,
    justifyContent: 'center',
  },
  headerLogo: {
    width: 26,
    height: 26,
    marginRight: spacing.sm,
  },
  headerBanner: {
    height: 30,
    aspectRatio: 1200 / 280,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  startBanner: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1200 / 280,
    marginBottom: spacing.lg,
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
  startContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
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
  guestNameInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    marginBottom: spacing.md,
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
    backgroundColor: 'rgba(245,158,11,0.12)',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xxl,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  hintLabel: {
    ...typography.caption,
    color: '#FCD34D',
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
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 10,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  criteriaButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: 'rgba(245,158,11,0.12)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    color: '#FCD34D',
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

  // ===== ヒーロー（スタート画面コピー） =====
  heroCopy: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
    marginTop: spacing.md,
  },
  heroSub: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  // ===== お笑いセンス診断カード =====
  diagCard: {
    backgroundColor: diag.bgCard,
    borderRadius: 28,
    padding: spacing.xxl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: diag.glassBorder,
    shadowColor: diag.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
    overflow: 'hidden',
  },
  diagLabel: {
    fontSize: 13,
    color: diag.textSub,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 2,
  },
  diagDeviation: {
    fontSize: 88,
    fontWeight: '900',
    color: diag.pinkLight,
    lineHeight: 96,
    textShadowColor: diag.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  diagTopPill: {
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderColor: diag.purple,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 6,
  },
  diagTopPillText: {
    color: diag.text,
    fontWeight: '700',
    fontSize: 14,
  },
  diagTypeLabel: {
    color: diag.textSub,
    fontSize: 14,
    marginTop: spacing.xl,
  },
  diagType: {
    color: diag.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  diagAxes: {
    width: '100%',
    marginTop: spacing.xxl,
    gap: 10,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: diag.textSub,
    fontSize: 15,
    fontWeight: '600',
  },
  axisStars: {
    fontSize: 20,
    letterSpacing: 2,
  },
  axisStarOn: {
    color: diag.star,
  },
  axisStarOff: {
    color: diag.starEmpty,
  },
  wrappedCard: {
    width: '100%',
    marginTop: spacing.xxl,
    backgroundColor: diag.glass,
    borderColor: diag.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
  },
  wrappedLabel: {
    color: diag.purpleSoft,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  wrappedText: {
    color: diag.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  judgeRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.xxl,
    gap: 12,
    alignItems: 'flex-start',
  },
  judgeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  judgeAvatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  judgeBubble: {
    flex: 1,
    backgroundColor: diag.glass,
    borderColor: diag.glassBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
  },
  judgeName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  judgeComment: {
    color: diag.text,
    fontSize: 15,
    lineHeight: 22,
  },
  diagHint: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(251,191,36,0.10)',
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  diagHintText: {
    color: '#FDE68A',
    fontSize: 14,
    lineHeight: 21,
  },
  diagTime: {
    color: diag.textSub,
    fontSize: 12,
    marginTop: spacing.md,
  },
  neonShareButton: {
    backgroundColor: diag.pink,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: diag.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  neonShareButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  xShareButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: diag.glassBorder,
    backgroundColor: diag.glass,
  },
  xShareButtonText: {
    color: diag.text,
    fontWeight: '700',
    fontSize: 15,
  },

  // 総合診断モード
  singleModeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: diag.glass,
  },
  singleModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  diagProgress: {
    marginBottom: spacing.lg,
  },
  diagProgressText: {
    ...typography.bodySmall,
    color: diag.purpleSoft,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  diagProgressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: diag.glass,
    overflow: 'hidden',
  },
  diagProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: diag.pink,
  },
  diagResultHeader: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  diagResultSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  diagBreakdownTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  diagBreakItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  diagBreakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  diagBreakNum: {
    fontWeight: '900',
    color: diag.pinkLight,
    fontSize: 15,
  },
  diagBreakScore: {
    fontWeight: '700',
    color: colors.textSecondary,
    fontSize: 13,
  },
  diagBreakTopic: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  diagBreakAnswer: {
    ...typography.body,
    color: colors.text,
  },

  // 段位ダッシュボード（ホーム）
  rankCard: {
    width: '100%',
    backgroundColor: diag.bgCard,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: diag.gold,
    padding: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: diag.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  rankCardLabel: {
    fontSize: 13,
    color: diag.goldLight,
    letterSpacing: 2,
    fontWeight: '700',
  },
  rankCardDan: {
    fontSize: 56,
    fontWeight: '900',
    color: diag.goldLight,
    lineHeight: 64,
    marginVertical: 4,
    textShadowColor: diag.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  rankCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
    justifyContent: 'space-around',
  },
  rankCardStat: {
    alignItems: 'center',
    flex: 1,
  },
  rankStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: diag.text,
  },
  rankStatLabel: {
    fontSize: 11,
    color: diag.textSub,
    marginTop: 2,
  },
  rankCardDivider: {
    width: 1,
    height: 36,
    backgroundColor: diag.glassBorder,
  },

  // 認定証カード
  certCard: {
    backgroundColor: diag.bgCard,
    borderRadius: 24,
    padding: spacing.xxl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: diag.gold,
    shadowColor: diag.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
    overflow: 'hidden',
  },
  certBrand: {
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: '800',
    color: diag.goldLight,
    marginBottom: spacing.md,
  },
  certRankLabel: {
    fontSize: 13,
    color: diag.textSub,
    letterSpacing: 2,
  },
  certRankDan: {
    fontSize: 72,
    fontWeight: '900',
    color: diag.goldLight,
    lineHeight: 80,
    textShadowColor: diag.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  certDivider: {
    width: '70%',
    height: 1,
    backgroundColor: diag.gold,
    opacity: 0.4,
    marginVertical: spacing.lg,
  },

  // 今日の検定バナー
  dailyBanner: {
    width: '100%',
    backgroundColor: diag.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: diag.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  dailyBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dailyBannerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: diag.goldLight,
    letterSpacing: 1,
  },
  dailyBannerCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dailyBannerTopic: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  dailyBannerCta: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'right',
  },

  // 検定カテゴリ
  categoryHeading: {
    width: '100%',
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catCard: {
    width: '48%',
    backgroundColor: diag.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: diag.glassBorder,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  catCardPrimary: {
    borderColor: diag.gold,
    backgroundColor: diag.goldSoft,
  },
  catEmoji: {
    fontSize: 30,
    marginBottom: spacing.xs,
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  catSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // 瞬発力検定タイマー
  speedTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: diag.glass,
    borderWidth: 1,
    borderColor: diag.glassBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  speedTimerWarn: {
    borderColor: colors.error,
    backgroundColor: 'rgba(251,113,133,0.12)',
  },
  speedTimerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  speedTimerValue: {
    fontSize: 24,
    fontWeight: '900',
    color: diag.goldLight,
  },
  speedTimerValueWarn: {
    color: colors.error,
  },
});
