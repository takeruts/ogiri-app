// Unsplash API サービス
// 写真で一言モード用のランダム画像取得

const getUnsplashApiKey = (): string => {
  // @ts-ignore - Expo環境変数
  const key = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.error('EXPO_PUBLIC_UNSPLASH_ACCESS_KEY is not set');
    throw new Error('Unsplash API key not configured');
  }
  return key;
};

const UNSPLASH_API_URL = 'https://api.unsplash.com';

// 大喜利向けの面白い状況が多い検索キーワード
const photoKeywords = [
  'funny animals',
  'surprised face',
  'awkward moment',
  'confused',
  'fail',
  'weird situation',
  'unexpected',
  'strange',
  'unusual scene',
  'silly',
  'absurd',
  'quirky',
  'odd',
  'bizarre',
  'funny pets',
  'reaction',
  'shocked',
  'dramatic',
  'office humor',
  'street photography candid',
];

export interface UnsplashPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  description: string | null;
  photographer: string;
  photographerUrl: string;
}

// ランダムな写真を取得
export const getRandomPhoto = async (): Promise<UnsplashPhoto> => {
  const apiKey = getUnsplashApiKey();

  // ランダムなキーワードを選択
  const keyword = photoKeywords[Math.floor(Math.random() * photoKeywords.length)];

  const response = await fetch(
    `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(keyword)}&orientation=landscape&content_filter=high`,
    {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Unsplash API error:', error);
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    url: data.urls.regular,
    thumbUrl: data.urls.thumb,
    description: data.description || data.alt_description,
    photographer: data.user.name,
    photographerUrl: data.user.links.html,
  };
};

// 複数の写真を取得（キャッシュ用）
export const getMultiplePhotos = async (count: number = 10): Promise<UnsplashPhoto[]> => {
  const apiKey = getUnsplashApiKey();

  // ランダムなキーワードを選択
  const keyword = photoKeywords[Math.floor(Math.random() * photoKeywords.length)];

  const response = await fetch(
    `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(keyword)}&orientation=landscape&content_filter=high&count=${count}`,
    {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Unsplash API error:', error);
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();

  return data.map((photo: any) => ({
    id: photo.id,
    url: photo.urls.regular,
    thumbUrl: photo.urls.thumb,
    description: photo.description || photo.alt_description,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
  }));
};

// Unsplashの利用規約に従ったクレジット表示用のテキスト
export const getPhotoCredit = (photo: UnsplashPhoto): string => {
  return `Photo by ${photo.photographer} on Unsplash`;
};
