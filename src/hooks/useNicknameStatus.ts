// ニックネーム入力のリアルタイム重複チェック用フック
// 入力が変わるたびにデバウンスして、他ユーザーと重複していないかを判定する。
import { useEffect, useState } from 'react';
import { isNicknameTaken } from '../services/nicknameService';

export type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken';

export function useNicknameStatus(name: string, excludeUserId?: string): NicknameStatus {
  const [status, setStatus] = useState<NicknameStatus>('idle');

  useEffect(() => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      const taken = await isNicknameTaken(trimmed, excludeUserId);
      if (!cancelled) setStatus(taken ? 'taken' : 'available');
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, excludeUserId]);

  return status;
}
