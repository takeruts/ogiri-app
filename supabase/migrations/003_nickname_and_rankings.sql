-- 003: ニックネーム必須化とランキング機能の強化

-- 1. ニックネームテーブルを作成（ログインユーザーと匿名ユーザー両方対応）
CREATE TABLE IF NOT EXISTS nicknames (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT, -- 匿名ユーザー用のデバイス識別子
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT nickname_length CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 20)
);

-- nicknames のインデックス
CREATE INDEX IF NOT EXISTS idx_nicknames_nickname ON nicknames(nickname);
CREATE INDEX IF NOT EXISTS idx_nicknames_user_id ON nicknames(user_id);
CREATE INDEX IF NOT EXISTS idx_nicknames_device_id ON nicknames(device_id);

-- nicknames のRLS
ALTER TABLE nicknames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nicknames are viewable by everyone" ON nicknames;
DROP POLICY IF EXISTS "Anyone can insert nicknames" ON nicknames;
DROP POLICY IF EXISTS "Users can update own nickname" ON nicknames;

CREATE POLICY "Nicknames are viewable by everyone"
  ON nicknames FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert nicknames"
  ON nicknames FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own nickname"
  ON nicknames FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 2. game_historyにnickname_idを追加
ALTER TABLE game_history ADD COLUMN IF NOT EXISTS nickname_id UUID REFERENCES nicknames(id);

-- 3. game_historyのRLSを更新（匿名ユーザーも挿入可能に）
DROP POLICY IF EXISTS "Users can insert own game history" ON game_history;
DROP POLICY IF EXISTS "Anyone can insert game history" ON game_history;
DROP POLICY IF EXISTS "Game history is viewable by everyone" ON game_history;
DROP POLICY IF EXISTS "Users can read own game history" ON game_history;

-- 全員が閲覧可能（ランキング表示用）
CREATE POLICY "Game history is viewable by everyone"
  ON game_history FOR SELECT
  USING (true);

-- 全員が挿入可能（匿名ユーザーも）
CREATE POLICY "Anyone can insert game history"
  ON game_history FOR INSERT
  WITH CHECK (true);

-- 4. 高得点ランキングビュー（トップ30、お題・回答・ニックネーム・回答時間を含む）
DROP VIEW IF EXISTS top_scores;

CREATE VIEW top_scores AS
SELECT
  gh.id,
  gh.topic,
  gh.answer,
  gh.score,
  gh.answer_time,
  gh.created_at,
  COALESCE(n.nickname, up.display_name, '匿名ユーザー') as nickname
FROM game_history gh
LEFT JOIN nicknames n ON gh.nickname_id = n.id
LEFT JOIN user_profiles up ON gh.user_id = up.id
ORDER BY gh.score DESC, gh.answer_time ASC NULLS LAST
LIMIT 30;

-- 5. 人気お題ランキングビュー（挑戦者数順）
DROP VIEW IF EXISTS popular_topics;

CREATE VIEW popular_topics AS
SELECT
  topic,
  COUNT(*)::integer as challenge_count,
  ROUND(AVG(score)::numeric, 1)::float as average_score,
  MAX(score)::integer as best_score,
  MIN(answer_time)::integer as fastest_time
FROM game_history
GROUP BY topic
ORDER BY challenge_count DESC
LIMIT 30;

-- 6. お題別ランキングビュー
DROP VIEW IF EXISTS topic_rankings;

CREATE VIEW topic_rankings AS
SELECT
  gh.id,
  gh.topic,
  gh.answer,
  gh.score,
  gh.answer_time,
  gh.created_at,
  COALESCE(n.nickname, up.display_name, '匿名ユーザー') as nickname,
  ROW_NUMBER() OVER (PARTITION BY gh.topic ORDER BY gh.score DESC, gh.answer_time ASC NULLS LAST) as rank
FROM game_history gh
LEFT JOIN nicknames n ON gh.nickname_id = n.id
LEFT JOIN user_profiles up ON gh.user_id = up.id;

-- 7. ニックネーム重複チェック用の関数
CREATE OR REPLACE FUNCTION check_nickname_available(check_nickname TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM nicknames WHERE LOWER(nickname) = LOWER(check_nickname)
  );
END;
$$ LANGUAGE plpgsql;
