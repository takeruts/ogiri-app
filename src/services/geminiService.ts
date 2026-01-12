// Expo環境変数の取得
const getApiKey = (): string => {
  // @ts-ignore - Expo環境変数
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    console.error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
    throw new Error('API key not configured');
  }
  return key;
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

// お題のジャンルリスト（ランダムに選択）
const topicCategories = [
  { theme: '職業', examples: ['こんな医者は嫌だ。どんな医者？', '一発でクビになる新人の行動とは？', '社長が朝礼で絶対に言ってはいけない一言とは？'] },
  { theme: '商品・サービス', examples: ['絶対に売れない商品名とは？', '1円でも高いと感じるサービスとは？', '逆に欲しくなる警告文とは？'] },
  { theme: '未来・SF', examples: ['100年後の学校にありそうなことは？', '宇宙人が地球に来てガッカリしたこととは？', 'タイムマシンの意外な使い道とは？'] },
  { theme: '日常生活', examples: ['朝起きて絶対に言いたくない一言とは？', 'エレベーターで気まずくなる行動とは？', '隣人に絶対に見られたくない瞬間とは？'] },
  { theme: '動物', examples: ['猫が絶対に思っていそうなこととは？', '動物園の動物が実は思っていることとは？', 'もしゴキブリに好感度があったら上がる行動とは？'] },
  { theme: '食べ物', examples: ['絶対に流行らないラーメン屋とは？', '食レポで言ってはいけない感想とは？', '料理番組でやってはいけない失敗とは？'] },
  { theme: 'イベント', examples: ['最悪の結婚式のサプライズとは？', 'お葬式で絶対に言ってはいけない一言とは？', '同窓会で一番気まずい瞬間とは？'] },
  { theme: 'テクノロジー', examples: ['使いたくないスマホの新機能とは？', 'AIが人類に反乱を起こさない理由とは？', 'SNSに絶対に投稿してはいけない内容とは？'] },
  { theme: 'スポーツ', examples: ['こんなオリンピック競技は嫌だ。どんな競技？', '実況アナウンサーが言ってはいけない一言とは？', 'サッカー選手が絶対にやってはいけないゴールパフォーマンスとは？'] },
  { theme: '学校', examples: ['こんな先生は嫌だ。どんな先生？', '卒業式で絶対に言ってはいけない答辞とは？', '修学旅行で絶対にやってはいけないこととは？'] },
  { theme: '恋愛', examples: ['最悪な告白の仕方とは？', 'デートで絶対にやってはいけないこととは？', '「別れよう」の最悪な言い方とは？'] },
  { theme: '家族', examples: ['親に絶対にバレたくないこととは？', 'おばあちゃんが実は思っていることとは？', '家族LINEに送ってはいけないメッセージとは？'] },
  { theme: '芸能・エンタメ', examples: ['絶対に売れないアイドルグループ名とは？', '映画の最悪なエンディングとは？', 'お笑い芸人が絶対に言ってはいけない一言とは？'] },
  { theme: '架空の設定', examples: ['魔王の意外な弱点とは？', '勇者が絶対にやってはいけないこととは？', 'サンタクロースの最大の不満とは？'] },
  { theme: '言葉遊び', examples: ['○○なのに××とは？（例：医者なのに不健康）', '逆に嬉しい悪口とは？', '言われて微妙な気持ちになる褒め言葉とは？'] },
  { theme: '歴史・偉人', examples: ['織田信長が現代に来たら最初にやりそうなこととは？', '歴史の教科書に載せてはいけない出来事とは？', '偉人の意外なあだ名とは？'] },
  { theme: '乗り物', examples: ['絶対に乗りたくないタクシーとは？', '飛行機内アナウンスで言ってはいけない一言とは？', '満員電車で一番迷惑な人とは？'] },
  { theme: 'お金', examples: ['絶対に当たりたくない宝くじとは？', 'ケチすぎて引かれる行動とは？', '一番もったいないお金の使い方とは？'] },
];

// お題の形式（ランダムに選択して多様性を出す）
const topicFormats = [
  '「こんな○○は嫌だ」形式',
  '「絶対に○○してはいけない△△とは？」形式',
  '「○○の意外な一面とは？」形式',
  '「○○が実は思っていることとは？」形式',
  '「最悪な○○とは？」形式',
  '「逆に○○な△△とは？」形式',
  '「○○なのに△△」形式の矛盾系',
  '「一言で台無しにする○○とは？」形式',
];

// お題とジャンルを含む結果
export interface TopicResult {
  topic: string;
  genre: string;
  isFallback?: boolean; // フォールバックお題かどうか
}

// お題を生成する（リトライ機能付き）
const generateTopicOnce = async (): Promise<TopicResult> => {
  // ランダムにジャンルを選択
  const category = topicCategories[Math.floor(Math.random() * topicCategories.length)];
  const format = topicFormats[Math.floor(Math.random() * topicFormats.length)];
  // 例からランダムに2つ選ぶ
  const shuffledExamples = [...category.examples].sort(() => Math.random() - 0.5);

  const prompt = `あなたは日本語の大喜利のお題を作る専門家です。

【タスク】
日本語で大喜利のお題を1つだけ生成してください。

【条件】
- ジャンル：${category.theme}
- 形式の参考：${format}
- 必ず日本語で書くこと（英語禁止）
- 必ず完全な文にすること（途中で終わらない）
- 必ず「？」で終わる疑問文にすること
- 短く簡潔に（20〜40文字程度）
- 例とは違う独創的なお題にすること
- お題だけを1行で出力（説明不要）

【参考例】
・${shuffledExamples[0]}
・${shuffledExamples[1]}

【出力】`;

  const apiKey = getApiKey();
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 256,
      },
    }),
  });

  const data: GeminiResponse = await response.json();
  console.log('Topic generation response status:', response.status);

  if (!response.ok) {
    console.error('Gemini API error response:', data);
    throw new Error(`API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }

  let topic = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  console.log('Raw topic from API:', topic);

  if (!topic) {
    console.error('Empty topic received, full response:', JSON.stringify(data));
    throw new Error('お題の生成に失敗しました');
  }

  // クリーンアップ
  topic = topic
    .replace(/^(Idea\s*\d+:\s*\*?\s*)/i, '')
    .replace(/^\*\*.*?\*\*\s*/g, '')
    .replace(/^[\d]+\.\s*/, '')
    .replace(/^\*+\s*/, '')
    .replace(/^[「『]/, '')
    .replace(/[」』]$/, '')
    .replace(/^お題[：:]\s*/i, '')
    .split('\n')[0]
    .trim();

  // 「？」で終わっているか確認、なければ追加
  if (!topic.endsWith('？') && !topic.endsWith('?')) {
    console.log('Topic missing ?, adding:', topic);
    topic = topic + '？';
  }

  // 基本バリデーション: 不完全なお題をチェック
  const isBasicValidTopic = (t: string): boolean => {
    // 最低15文字以上（短すぎる＝途中で切れている可能性）
    if (t.length < 15) {
      console.log('Topic too short:', t.length, 'chars');
      return false;
    }
    // 英語のみのお題は無効
    if (/^[a-zA-Z0-9\s\?\.\!\,\'\"\-\(\)]+$/.test(t)) {
      console.log('Topic is English only:', t);
      return false;
    }
    // 「？」で終わっていない（？を追加した後なので、ここには来ないはず）
    if (!t.endsWith('？') && !t.endsWith('?')) {
      console.log('Topic does not end with ?:', t);
      return false;
    }
    // 明らかに不完全な文（「、」や「を」「が」「に」「は」で終わる）
    const incompleteEndings = ['、？', 'を？', 'が？', 'に？', 'は？', 'で？', 'と？', 'の？', 'な？'];
    for (const ending of incompleteEndings) {
      if (t.endsWith(ending)) {
        console.log('Topic has incomplete ending:', t);
        return false;
      }
    }
    return true;
  };

  if (!isBasicValidTopic(topic)) {
    throw new Error('不完全なお題が生成されました');
  }

  // AIによる品質チェック（2回目のAPI呼び出し）
  const qualityCheckResult = await checkTopicQuality(topic, apiKey);
  if (!qualityCheckResult.isValid) {
    console.log('Topic failed quality check:', qualityCheckResult.reason);
    throw new Error(`お題の品質チェックに失敗: ${qualityCheckResult.reason}`);
  }

  return { topic, genre: category.theme };
};

// お題の品質をAIでチェックする関数
const checkTopicQuality = async (topic: string, apiKey: string): Promise<{ isValid: boolean; reason?: string }> => {
  const checkPrompt = `以下のお題が大喜利のお題として適切かどうか、厳しく判定してください。

【お題】
${topic}

【合格条件（すべて満たす必要あり）】
1. 日本語として文法的に正しく、意味が通じる完全な文である
2. 途中で切れていない（文末が自然に終わっている）
3. 「〜とは？」「どんな〜？」「どういうこと？」など、面白い回答を求める形式になっている
4. 回答者が「何を答えればいいか」が明確にわかる
5. 単なるYes/Noで答えられる質問ではない

【不合格の例】
- 「自動販売機が、お釣りを出した？」→ 何を答えればいいか不明
- 「猫が寝ている？」→ Yes/Noで終わる
- 「意外な○○？」→ 途中で切れている
- 「〜の理由とは」→ 疑問文になっていない

【合格の例】
- 「絶対に乗りたくないタクシーとは？」
- 「こんな医者は嫌だ。どんな医者？」
- 「猫が飼い主に絶対に言いたいこととは？」

【回答形式】
OK または NG のみを出力。NGの場合は理由も1行で。
例: OK
例: NG:何を答えればいいか不明確`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: checkPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        },
      }),
    });

    if (!response.ok) {
      console.log('Quality check API failed, assuming valid');
      return { isValid: true }; // APIエラーの場合は通す
    }

    const data: GeminiResponse = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    console.log('Quality check result:', result);

    if (result.startsWith('OK')) {
      return { isValid: true };
    } else if (result.startsWith('NG')) {
      const reason = result.replace(/^NG[：:]?\s*/, '') || '品質基準を満たしていません';
      return { isValid: false, reason };
    }

    // 判定できない場合は通す
    return { isValid: true };
  } catch (error) {
    console.log('Quality check error, assuming valid:', error);
    return { isValid: true }; // エラーの場合は通す
  }
};

// フォールバック用のお題（ジャンル付き）
const fallbackTopics: TopicResult[] = [
  { topic: 'こんなラーメン屋は絶対に流行らない。どんなラーメン屋？', genre: '食べ物' },
  { topic: '絶対に使いたくないスマホアプリの名前とは？', genre: 'テクノロジー' },
  { topic: '未来の運動会にありそうな競技とは？', genre: '未来・SF' },
  { topic: 'こんな先生は嫌だ。どんな先生？', genre: '学校' },
  { topic: '絶対に売れない新商品の名前とは？', genre: '商品・サービス' },
  { topic: 'こんな美容室は嫌だ。どんな美容室？', genre: '職業' },
  { topic: '絶対に乗りたくないタクシーとは？', genre: '乗り物' },
  { topic: '100年後のコンビニにありそうなものとは？', genre: '未来・SF' },
  { topic: '猫が飼い主に絶対に言いたいこととは？', genre: '動物' },
  { topic: '最悪なデートの誘い方とは？', genre: '恋愛' },
  { topic: '誰も見たくないYouTube動画のタイトルとは？', genre: 'テクノロジー' },
  { topic: '食レポで絶対に言ってはいけない感想とは？', genre: '食べ物' },
  { topic: '絶対に買いたくない家電とは？', genre: '商品・サービス' },
  { topic: '同窓会で一番気まずい再会とは？', genre: 'イベント' },
  { topic: '最悪な誕生日プレゼントとは？', genre: 'イベント' },
  { topic: 'エレベーターで絶対にやってはいけないこととは？', genre: '日常生活' },
  { topic: '映画の最悪なエンディングとは？', genre: '芸能・エンタメ' },
  { topic: '魔王の意外な趣味とは？', genre: '架空の設定' },
  { topic: '最悪なプロポーズの言葉とは？', genre: '恋愛' },
  { topic: '親に絶対にバレたくない検索履歴とは？', genre: '家族' },
  { topic: '織田信長がSNSを始めたら最初の投稿は？', genre: '歴史・偉人' },
  { topic: '言われて微妙な気持ちになる褒め言葉とは？', genre: '言葉遊び' },
  { topic: '宝くじで1億円当たったら絶対にやってはいけないこととは？', genre: 'お金' },
  { topic: '満員電車で一番迷惑な人とは？', genre: '乗り物' },
  { topic: 'お葬式で絶対に言ってはいけない一言とは？', genre: 'イベント' },
  { topic: '実況アナウンサーが言ってはいけない一言とは？', genre: 'スポーツ' },
  { topic: 'おばあちゃんが実は思っていることとは？', genre: '家族' },
  { topic: 'サンタクロースの最大の不満とは？', genre: '架空の設定' },
  { topic: 'AIが人類に反乱を起こさない本当の理由とは？', genre: 'テクノロジー' },
  { topic: '医者なのに絶対に信用できない発言とは？', genre: '職業' },
];

export const generateTopic = async (): Promise<TopicResult> => {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Generating topic (attempt ${i + 1}/${maxRetries})...`);
      const result = await generateTopicOnce();
      console.log('Generated topic:', result);
      return result;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        // 最後の試行も失敗したらフォールバック
        const fallback = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
        console.log('Using fallback topic:', fallback);
        return { ...fallback, isFallback: true };
      }
    }
  }

  throw new Error('お題の生成に失敗しました');
};

// 回答を採点する
export interface ScoreResult {
  score: number;
  comment: string;
  hint: string;
}

// 採点基準（UIでも表示するためexport）
export const SCORING_CRITERIA = {
  title: '採点基準',
  description: 'AIは以下の観点で0〜100点で採点します',
  criteria: [
    {
      name: '意外性・裏切り',
      weight: '40点',
      description: '予想外の角度からの回答、期待を良い意味で裏切る発想',
    },
    {
      name: '笑いのインパクト',
      weight: '30点',
      description: '思わず笑ってしまう破壊力、クスッとくる面白さ',
    },
    {
      name: 'お題との関連性',
      weight: '20点',
      description: 'お題の意図を理解し、的確に応えているか',
    },
    {
      name: '表現の巧みさ',
      weight: '10点',
      description: '言葉選び、テンポ、簡潔さなどの表現力',
    },
  ],
  tips: [
    '王道の回答より、少しズラした視点が高得点のコツ',
    '長い説明より、短く切れ味のある回答を',
    'お題のキーワードを活かしつつ、予想外の展開を',
  ],
};

// 写真で一言の採点（画像URLと回答を送信）
export const scorePhotoAnswer = async (imageUrl: string, answer: string): Promise<ScoreResult> => {
  const prompt = `写真で一言の大喜利を採点してください。
この写真に対する「一言」回答を評価します。JSONのみ出力してください。

回答：${answer}

採点基準（100点満点）:
- 意外性・裏切り（40点）: 写真から予想できない面白い解釈か
- 笑いのインパクト（30点）: 思わず笑える破壊力
- 写真との関連性（20点）: 写真の状況を活かしているか
- 表現の巧みさ（10点）: 言葉選び、簡潔さ

{"score":数字0-100,"comment":"面白い点や足りない点を30字以内","hint":"この写真でウケるコツを50字以内"}`;

  try {
    const apiKey = getApiKey();
    console.log('Calling Gemini API for photo scoring...');

    // 画像をBase64に変換するか、URLを直接使用
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: await fetchImageAsBase64(imageUrl),
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data: GeminiResponse = await response.json();

    if (!response.ok) {
      console.error('Gemini API error response:', data);
      throw new Error(`API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!resultText) {
      console.error('Empty score response:', data);
      throw new Error('採点結果の生成に失敗しました');
    }

    console.log('Photo score result text:', resultText);

    // JSONをパース
    let jsonStr = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const startIndex = jsonStr.indexOf('{');
    const endIndex = jsonStr.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonStr = jsonStr.substring(startIndex, endIndex + 1);
    }

    let result: ScoreResult;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log('JSON parse failed, trying manual extraction...');
      const scoreMatch = resultText.match(/"score"\s*:\s*(\d+)/);
      const commentMatch = resultText.match(/"comment"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const hintMatch = resultText.match(/"hint"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      result = {
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 5,
        comment: commentMatch ? commentMatch[1].replace(/\\"/g, '"') : '採点完了',
        hint: hintMatch ? hintMatch[1].replace(/\\"/g, '"') : '写真の状況を活かしてみましょう！',
      };
    }

    result.score = Math.max(0, Math.min(100, Math.round(result.score)));
    return result;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

// 画像URLからBase64を取得するヘルパー関数
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // data:image/jpeg;base64, の部分を除去
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const scoreAnswer = async (topic: string, answer: string): Promise<ScoreResult> => {
  const prompt = `大喜利採点。JSONのみ出力。

お題：${topic}
回答：${answer}

採点基準（100点満点）:
- 意外性・裏切り（40点）: 予想外の角度からの回答か
- 笑いのインパクト（30点）: 思わず笑える破壊力
- お題との関連性（20点）: お題の意図を理解しているか
- 表現の巧みさ（10点）: 言葉選び、簡潔さ

{"score":数字0-100,"comment":"面白い点や足りない点を30字以内","hint":"お題の狙いと高得点のコツを50字以内"}`;

  try {
    const apiKey = getApiKey();
    console.log('Calling Gemini API for scoring...');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data: GeminiResponse = await response.json();

    if (!response.ok) {
      console.error('Gemini API error response:', data);
      throw new Error(`API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!resultText) {
      console.error('Empty score response:', data);
      throw new Error('採点結果の生成に失敗しました');
    }

    console.log('Score result text:', resultText);

    // JSONをパース（```json と ``` を除去）
    let jsonStr = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // JSONオブジェクトを抽出（最後の } まで取得）
    const startIndex = jsonStr.indexOf('{');
    const endIndex = jsonStr.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonStr = jsonStr.substring(startIndex, endIndex + 1);
    }

    console.log('Parsed JSON string:', jsonStr);

    let result: ScoreResult;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      // JSONパースに失敗した場合、個別にフィールドを抽出
      console.log('JSON parse failed:', parseError);
      console.log('Trying manual extraction...');

      // より柔軟な正規表現で抽出（日本語対応）
      const scoreMatch = resultText.match(/"score"\s*:\s*(\d+)/);
      const commentMatch = resultText.match(/"comment"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const hintMatch = resultText.match(/"hint"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      result = {
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 5,
        comment: commentMatch ? commentMatch[1].replace(/\\"/g, '"') : '採点完了',
        hint: hintMatch ? hintMatch[1].replace(/\\"/g, '"') : '次も頑張ってください！',
      };

      console.log('Manual extraction result:', result);
    }

    // スコアを0-100の範囲に正規化
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));

    return result;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};
