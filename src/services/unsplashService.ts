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

// 大喜利向けの面白い状況が多い検索キーワード（シンプルな単語で検索結果を確保）
const photoKeywords = [
  'funny',
  'animals',
  'pets',
  'cat',
  'dog',
  'surprised',
  'office',
  'street',
  'people',
  'food',
  'city',
  'nature',
  'beach',
  'party',
  'sports',
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

  // まずキーワード付きで試行
  let response = await fetch(
    `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(keyword)}&orientation=landscape&content_filter=high`,
    {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    }
  );

  // キーワード検索で失敗した場合、キーワードなしで再試行
  if (!response.ok) {
    console.log(`Keyword search failed for "${keyword}", trying without query...`);
    response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
        },
      }
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Unsplash API error:', error);
    throw new Error(`Unsplash API error: ${response.status} - ${error.errors?.[0] || 'Unknown error'}`);
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
