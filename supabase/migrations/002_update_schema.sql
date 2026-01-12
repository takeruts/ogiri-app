-- 既存テーブルの更新（エラーを無視するためIF NOT EXISTSを使用）

-- 1. answer_timeカラムを追加
ALTER TABLE game_history ADD COLUMN IF NOT EXISTS answer_time INTEGER;

-- 2. hintカラムを追加（なければ）
ALTER TABLE game_history ADD COLUMN IF NOT EXISTS hint TEXT;

-- 3. スコア制約を更新（0-100に変更）
-- 既存の制約を削除してから新しい制約を追加
ALTER TABLE game_history DROP CONSTRAINT IF EXISTS game_history_score_check;
ALTER TABLE game_history ADD CONSTRAINT game_history_score_check CHECK (score >= 0 AND score <= 100);

-- 4. user_profilesテーブルを作成
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. user_profiles のRLSを設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシーを削除してから再作成（エラー回避）
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. user_rankingsビューを作成（平均点ベース）
DROP VIEW IF EXISTS user_rankings;

CREATE VIEW user_rankings AS
SELECT
  gh.user_id,
  COALESCE(up.display_name, '匿名ユーザー') as display_name,
  COUNT(*)::integer as total_games,
  SUM(gh.score)::integer as total_score,
  ROUND(AVG(gh.score)::numeric, 1)::float as average_score,
  MAX(gh.score)::integer as best_score
FROM game_history gh
LEFT JOIN user_profiles up ON gh.user_id = up.id
GROUP BY gh.user_id, up.display_name
HAVING COUNT(*) >= 1
ORDER BY AVG(gh.score) DESC;
