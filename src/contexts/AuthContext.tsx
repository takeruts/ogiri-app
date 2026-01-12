import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nickname: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
        emailRedirectTo: undefined,
      },
    });
    if (error) throw error;

    // プロフィールとニックネームを手動で作成
    if (data.user) {
      // profilesテーブルに保存
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: nickname,
        });

      // プロフィールが既に存在する場合はエラーを無視
      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('プロフィール作成エラー:', profileError);
      }

      // user_profilesテーブルに保存（存在する場合）
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          display_name: nickname,
        });

      if (userProfileError && !userProfileError.message.includes('duplicate')) {
        console.error('ユーザープロフィール作成エラー:', userProfileError);
      }

      // nicknamesテーブルに保存（ランキング表示用）
      const { error: nicknameError } = await supabase
        .from('nicknames')
        .insert({
          nickname: nickname.trim(),
          user_id: data.user.id,
        });

      if (nicknameError && nicknameError.code !== '23505') {
        console.error('ニックネーム作成エラー:', nicknameError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
