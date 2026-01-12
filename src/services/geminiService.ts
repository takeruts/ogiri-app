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
  { theme: '職業', examples: ['こんな医者は嫌だ。どんな医者？', 'こんな美容師は嫌だ。どんな美容師？'] },
  { theme: '商品・サービス', examples: ['絶対に売れない商品名とは？', '誰も使わないアプリの名前とは？'] },
  { theme: '未来・SF', examples: ['100年後の学校にありそうなことは？', '未来の運動会の新競技とは？'] },
  { theme: '日常生活', examples: ['朝起きて絶対に言いたくない一言とは？', 'こんなコンビニは嫌だ。どんなコンビニ？'] },
  { theme: '動物', examples: ['もしペットが喋れたら絶対に言いそうなことは？', 'こんな動物園は嫌だ。どんな動物園？'] },
  { theme: '食べ物', examples: ['絶対に流行らないラーメン屋とは？', '誰も注文しないメニュー名とは？'] },
  { theme: 'イベント', examples: ['最悪の結婚式のサプライズとは？', '誰も来ないイベントの名前とは？'] },
  { theme: 'テクノロジー', examples: ['使いたくないスマホの新機能とは？', 'AIが絶対にやってはいけないことは？'] },
  { theme: 'スポーツ', examples: ['こんなオリンピック競技は嫌だ。どんな競技？', '最悪なスポーツ実況とは？'] },
  { theme: '学校', examples: ['こんな先生は嫌だ。どんな先生？', '絶対に入りたくない部活とは？'] },
];

// お題を生成する（リトライ機能付き）
const generateTopicOnce = async (): Promise<string> => {
  // ランダムにジャンルを選択
  const category = topicCategories[Math.floor(Math.random() * topicCategories.length)];
  const randomSeed = Math.floor(Math.random() * 1000);

  const prompt = `大喜利のお題を1つ出して。「${category.theme}」に関するお題。
短く簡潔に、必ず「？」で終わること。例に似すぎない独創的なお題を。

例：
・${category.examples[0]}
・${category.examples[1]}

お題（${randomSeed}）：`;

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
        maxOutputTokens: 100,
        stopSequences: ['\n\n'],
      },
    }),
  });

  const data: GeminiResponse = await response.json();

  if (!response.ok) {
    console.error('Gemini API error response:', data);
    throw new Error(`API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }

  let topic = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!topic) {
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

  // 「？」で終わっているか確認
  if (!topic.endsWith('？') && !topic.endsWith('?')) {
    console.log('Topic incomplete (no ?), rejecting:', topic);
    throw new Error('お題が不完全です');
  }

  return topic;
};

export const generateTopic = async (): Promise<string> => {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Generating topic (attempt ${i + 1}/${maxRetries})...`);
      const topic = await generateTopicOnce();
      console.log('Generated topic:', topic);
      return topic;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        // 最後の試行も失敗したらフォールバック
        const fallbackTopics = [
          'こんなラーメン屋は絶対に流行らない。どんなラーメン屋？',
          '絶対に使いたくないスマホアプリの名前とは？',
          '未来の運動会にありそうな競技とは？',
          'こんな先生は嫌だ。どんな先生？',
          '絶対に売れない新商品の名前とは？',
          'こんな美容室は嫌だ。どんな美容室？',
          '絶対に乗りたくないタクシーとは？',
          '100年後のコンビニにありそうなものとは？',
          'こんな動物園は嫌だ。どんな動物園？',
          '最悪なデートスポットとは？',
          '誰も見たくないYouTube動画のタイトルとは？',
          'こんな居酒屋は嫌だ。どんな居酒屋？',
          '絶対に買いたくない家電とは？',
          'こんな遊園地は嫌だ。どんな遊園地？',
          '最悪な誕生日プレゼントとは？',
          'こんなホテルは嫌だ。どんなホテル？',
          '絶対に見たくない映画のタイトルとは？',
          'こんな病院は嫌だ。どんな病院？',
          '最悪なプロポーズの言葉とは？',
          '絶対に住みたくない街の名前とは？',
        ];
        const fallback = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
        console.log('Using fallback topic:', fallback);
        return fallback;
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

export const scoreAnswer = async (topic: string, answer: string): Promise<ScoreResult> => {
  const prompt = `大喜利採点。JSONのみ出力。

お題：${topic}
回答：${answer}

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
