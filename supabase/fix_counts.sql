-- お題のいいね数を再計算
UPDATE topics t
SET
  likes_count = (
    SELECT COUNT(*)
    FROM topic_reactions tr
    WHERE tr.topic_id = t.id AND tr.reaction_type = 'like'
  ),
  dislikes_count = (
    SELECT COUNT(*)
    FROM topic_reactions tr
    WHERE tr.topic_id = t.id AND tr.reaction_type = 'dislike'
  );

-- 回答のいいね数を再計算
UPDATE answers a
SET
  likes_count = (
    SELECT COUNT(*)
    FROM answer_reactions ar
    WHERE ar.answer_id = a.id AND ar.reaction_type = 'like'
  ),
  dislikes_count = (
    SELECT COUNT(*)
    FROM answer_reactions ar
    WHERE ar.answer_id = a.id AND ar.reaction_type = 'dislike'
  );

-- 確認用クエリ（実行後に確認してください）
SELECT
  t.title,
  t.likes_count as current_likes,
  (SELECT COUNT(*) FROM topic_reactions tr WHERE tr.topic_id = t.id AND tr.reaction_type = 'like') as actual_likes,
  t.dislikes_count as current_dislikes,
  (SELECT COUNT(*) FROM topic_reactions tr WHERE tr.topic_id = t.id AND tr.reaction_type = 'dislike') as actual_dislikes
FROM topics t;

SELECT
  a.content,
  a.likes_count as current_likes,
  (SELECT COUNT(*) FROM answer_reactions ar WHERE ar.answer_id = a.id AND ar.reaction_type = 'like') as actual_likes,
  a.dislikes_count as current_dislikes,
  (SELECT COUNT(*) FROM answer_reactions ar WHERE ar.answer_id = a.id AND ar.reaction_type = 'dislike') as actual_dislikes
FROM answers a;
