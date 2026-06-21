-- オオギリ検定用のゲーム履歴テーブル
CREATE TABLE IF NOT EXISTS game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  answer TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  comment TEXT,
  hint TEXT,
  answer_time INTEGER, -- 回答時間（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成（ユーザーIDと作成日時での検索を高速化）
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);

-- RLS（Row Level Security）を有効化
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読み取り可能
CREATE POLICY "Users can read own game history"
  ON game_history FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ挿入可能
CREATE POLICY "Users can insert own game history"
  ON game_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザープロファイルテーブル
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 誰でもプロファイルを読み取り可能（ランキング表示用）
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

-- ユーザーは自分のプロファイルのみ更新可能
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ユーザーは自分のプロファイルを作成可能
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ユーザーランキングビュー（平均点でランキング）
CREATE OR REPLACE VIEW user_rankings AS
SELECT
  gh.user_id,
  COALESCE(up.display_name, '匿名ユーザー') as display_name,
  COUNT(*) as total_games,
  SUM(gh.score) as total_score,
  ROUND(AVG(gh.score)::numeric, 1) as average_score,
  MAX(gh.score) as best_score
FROM game_history gh
LEFT JOIN user_profiles up ON gh.user_id = up.id
GROUP BY gh.user_id, up.display_name
HAVING COUNT(*) >= 3 -- 3回以上プレイしたユーザーのみランキング対象
ORDER BY average_score DESC;
