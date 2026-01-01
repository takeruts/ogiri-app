-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- お題テーブル
CREATE TABLE topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  dislikes_count INTEGER DEFAULT 0 NOT NULL
);

-- 回答テーブル
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  dislikes_count INTEGER DEFAULT 0 NOT NULL
);

-- お題へのリアクションテーブル
CREATE TABLE topic_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(topic_id, user_id)
);

-- 回答へのリアクションテーブル
CREATE TABLE answer_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(answer_id, user_id)
);

-- インデックス作成
CREATE INDEX topics_user_id_idx ON topics(user_id);
CREATE INDEX topics_created_at_idx ON topics(created_at DESC);
CREATE INDEX answers_topic_id_idx ON answers(topic_id);
CREATE INDEX answers_user_id_idx ON answers(user_id);
CREATE INDEX answers_created_at_idx ON answers(created_at DESC);
CREATE INDEX topic_reactions_topic_id_idx ON topic_reactions(topic_id);
CREATE INDEX topic_reactions_user_id_idx ON topic_reactions(user_id);
CREATE INDEX answer_reactions_answer_id_idx ON answer_reactions(answer_id);
CREATE INDEX answer_reactions_user_id_idx ON answer_reactions(user_id);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_reactions ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のプロフィールを更新可能" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "ユーザーは自分のプロフィールを挿入可能" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- お題のポリシー
CREATE POLICY "お題は誰でも閲覧可能" ON topics FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーはお題を投稿可能" ON topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のお題を更新可能" ON topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のお題を削除可能" ON topics FOR DELETE USING (auth.uid() = user_id);

-- 回答のポリシー
CREATE POLICY "回答は誰でも閲覧可能" ON answers FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーは回答を投稿可能" ON answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分の回答を更新可能" ON answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分の回答を削除可能" ON answers FOR DELETE USING (auth.uid() = user_id);

-- お題リアクションのポリシー
CREATE POLICY "お題リアクションは誰でも閲覧可能" ON topic_reactions FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーはお題にリアクション可能" ON topic_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のリアクションを更新可能" ON topic_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のリアクションを削除可能" ON topic_reactions FOR DELETE USING (auth.uid() = user_id);

-- 回答リアクションのポリシー
CREATE POLICY "回答リアクションは誰でも閲覧可能" ON answer_reactions FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーは回答にリアクション可能" ON answer_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のリアクションを更新可能" ON answer_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ユーザーは自分のリアクションを削除可能" ON answer_reactions FOR DELETE USING (auth.uid() = user_id);

-- トリガー関数: updated_at を自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの設定
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- リアクション数を更新する関数
CREATE OR REPLACE FUNCTION update_topic_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE topics SET likes_count = likes_count + 1 WHERE id = NEW.topic_id;
    ELSE
      UPDATE topics SET dislikes_count = dislikes_count + 1 WHERE id = NEW.topic_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE topics SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 WHERE id = NEW.topic_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE topics SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = NEW.topic_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE topics SET likes_count = likes_count - 1 WHERE id = OLD.topic_id;
    ELSE
      UPDATE topics SET dislikes_count = dislikes_count - 1 WHERE id = OLD.topic_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_answer_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE answers SET likes_count = likes_count + 1 WHERE id = NEW.answer_id;
    ELSE
      UPDATE answers SET dislikes_count = dislikes_count + 1 WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE answers SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 WHERE id = NEW.answer_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE answers SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE answers SET likes_count = likes_count - 1 WHERE id = OLD.answer_id;
    ELSE
      UPDATE answers SET dislikes_count = dislikes_count - 1 WHERE id = OLD.answer_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- リアクション数更新のトリガー
CREATE TRIGGER topic_reaction_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON topic_reactions
  FOR EACH ROW EXECUTE FUNCTION update_topic_reaction_count();

CREATE TRIGGER answer_reaction_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON answer_reactions
  FOR EACH ROW EXECUTE FUNCTION update_answer_reaction_count();

-- 新規ユーザー登録時にプロフィールを自動作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 認証時に自動でプロフィールを作成するトリガー
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
