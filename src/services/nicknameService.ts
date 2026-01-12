import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NICKNAME_STORAGE_KEY = '@ogirihub_nickname';
const DEVICE_ID_STORAGE_KEY = '@ogirihub_device_id';

// デバイスIDを生成または取得
export const getDeviceId = async (): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (!deviceId) {
        deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      }
      return deviceId;
    } else {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (!deviceId) {
        deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      }
      return deviceId;
    }
  } catch (error) {
    console.error('デバイスID取得エラー:', error);
    return `temp_${Date.now()}`;
  }
};

// ローカルに保存されたニックネームを取得
export const getStoredNickname = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(NICKNAME_STORAGE_KEY);
    } else {
      return await AsyncStorage.getItem(NICKNAME_STORAGE_KEY);
    }
  } catch (error) {
    console.error('ニックネーム取得エラー:', error);
    return null;
  }
};

// ニックネームをローカルに保存
export const storeNickname = async (nickname: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    } else {
      await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    }
  } catch (error) {
    console.error('ニックネーム保存エラー:', error);
  }
};

// ニックネームが使用可能かチェック
export const checkNicknameAvailable = async (nickname: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('nicknames')
      .select('id')
      .ilike('nickname', nickname)
      .limit(1);

    if (error) throw error;
    return !data || data.length === 0;
  } catch (error) {
    console.error('ニックネームチェックエラー:', error);
    return false;
  }
};

// ニックネームを登録
export const registerNickname = async (
  nickname: string,
  userId?: string
): Promise<{ success: boolean; nicknameId?: string; error?: string }> => {
  try {
    // 使用可能かチェック
    const isAvailable = await checkNicknameAvailable(nickname);
    if (!isAvailable) {
      return { success: false, error: 'このニックネームは既に使用されています' };
    }

    const deviceId = await getDeviceId();

    const { data, error } = await supabase
      .from('nicknames')
      .insert({
        nickname: nickname.trim(),
        user_id: userId || null,
        device_id: userId ? null : deviceId,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'このニックネームは既に使用されています' };
      }
      throw error;
    }

    // ローカルに保存
    await storeNickname(nickname);

    return { success: true, nicknameId: data.id };
  } catch (error: any) {
    console.error('ニックネーム登録エラー:', error);
    return { success: false, error: error.message || '登録に失敗しました' };
  }
};

// 現在のユーザーまたはデバイスのニックネームIDを取得
export const getCurrentNicknameId = async (userId?: string): Promise<string | null> => {
  try {
    if (userId) {
      // ログインユーザーの場合
      const { data, error } = await supabase
        .from('nicknames')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.id || null;
    } else {
      // 匿名ユーザーの場合
      const deviceId = await getDeviceId();
      const { data, error } = await supabase
        .from('nicknames')
        .select('id')
        .eq('device_id', deviceId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.id || null;
    }
  } catch (error) {
    console.error('ニックネームID取得エラー:', error);
    return null;
  }
};

// ニックネーム情報を取得
export const getNicknameInfo = async (userId?: string): Promise<{ nickname: string; nicknameId: string } | null> => {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('nicknames')
        .select('id, nickname')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? { nickname: data.nickname, nicknameId: data.id } : null;
    } else {
      const deviceId = await getDeviceId();
      const { data, error } = await supabase
        .from('nicknames')
        .select('id, nickname')
        .eq('device_id', deviceId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? { nickname: data.nickname, nicknameId: data.id } : null;
    }
  } catch (error) {
    console.error('ニックネーム情報取得エラー:', error);
    return null;
  }
};
