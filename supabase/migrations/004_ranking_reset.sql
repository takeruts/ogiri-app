-- ランキング・段位のリセット（カットオフ方式）
--
-- 採点基準を辛口化したため、それ以前の甘い基準で付いたスコアを
-- 段位・ランキングの集計から外す。game_history は一切削除しない
-- （answer 列にユーザーの回答文が同居しているため）。
--
-- リセットの取り消し・再実行は ranking_config.reset_at の更新だけで済む：
--   UPDATE ranking_config SET reset_at = '2000-01-01'; -- 全期間を復活
--   UPDATE ranking_config SET reset_at = NOW();        -- 今この瞬間で再リセット

-- 1. カットオフ日時を保持する1行テーブル（id CHECK で複数行を防ぐ）
CREATE TABLE IF NOT EXISTS ranking_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 初回のみ「今」で投入。再実行しても既存の値を壊さない。
INSERT INTO ranking_config (id, reset_at)
VALUES (TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- クライアントが reset_at を読めるようにする（読み取り専用）
ALTER TABLE ranking_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "誰でもリセット日時を参照できる" ON ranking_config;
CREATE POLICY "誰でもリセット日時を参照できる" ON ranking_config
  FOR SELECT USING (TRUE);
-- INSERT/UPDATE/DELETE ポリシーは意図的に作らない。
-- 変更は service-role キーか SQL エディタからのみ。

-- 2. 各ビューを reset_at 以降のみ集計するよう再定義
--    （ビュー定義は 002 / 003 のものを踏襲し、カットオフ条件だけ追加）

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
CROSS JOIN ranking_config rc
WHERE gh.created_at >= rc.reset_at
GROUP BY gh.user_id, up.display_name
HAVING COUNT(*) >= 1
ORDER BY AVG(gh.score) DESC;

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
CROSS JOIN ranking_config rc
WHERE gh.created_at >= rc.reset_at
ORDER BY gh.score DESC, gh.answer_time ASC NULLS LAST
LIMIT 30;

DROP VIEW IF EXISTS popular_topics;

CREATE VIEW popular_topics AS
SELECT
  gh.topic,
  COUNT(*)::integer as challenge_count,
  ROUND(AVG(gh.score)::numeric, 1)::float as average_score,
  MAX(gh.score)::integer as best_score,
  MIN(gh.answer_time)::integer as fastest_time
FROM game_history gh
CROSS JOIN ranking_config rc
WHERE gh.created_at >= rc.reset_at
GROUP BY gh.topic
ORDER BY challenge_count DESC
LIMIT 30;

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
LEFT JOIN user_profiles up ON gh.user_id = up.id
CROSS JOIN ranking_config rc
WHERE gh.created_at >= rc.reset_at;
