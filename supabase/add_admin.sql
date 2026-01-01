-- profilesテーブルに管理者フラグを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- 既存のポリシーを削除して再作成
DROP POLICY IF EXISTS "ユーザーは自分のお題を削除可能" ON topics;
DROP POLICY IF EXISTS "管理者は全てのお題を削除可能" ON topics;

DROP POLICY IF EXISTS "ユーザーは自分の回答を削除可能" ON answers;
DROP POLICY IF EXISTS "管理者は全ての回答を削除可能" ON answers;

DROP POLICY IF EXISTS "管理者は全てのプロフィールを更新可能" ON profiles;
DROP POLICY IF EXISTS "管理者は全てのプロフィールを削除可能" ON profiles;

-- お題の削除ポリシー（自分のお題 OR 管理者）
CREATE POLICY "お題削除ポリシー" ON topics
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 回答の削除ポリシー（自分の回答 OR 管理者）
CREATE POLICY "回答削除ポリシー" ON answers
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- プロフィールの削除ポリシー（管理者のみ）
CREATE POLICY "プロフィール削除ポリシー" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- 既存のユーザーを管理者にする場合は、以下のコマンドを実行してください
-- UPDATE profiles SET is_admin = true WHERE username = 'your_admin_username';
-- または
-- UPDATE profiles SET is_admin = true WHERE email = 'your_email@example.com';
