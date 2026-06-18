// Google Analytics 4（GA4）送信ヘルパー（Web専用）
// gtag.js の読み込み・初期化は public/index.html の静的スニペットで完了している。
// ここでは window.gtag を使ってSPAの画面遷移や任意イベントを送信する。
// gtag 未定義（ネイティブやスニペット未読込）の場合は安全に何もしない。
import { Platform } from 'react-native';

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';

// 互換のため残置（読み込みは index.html 側で実施するため実処理は不要）
export function initAnalytics(): void {
  // no-op
}

// 画面表示（SPAの仮想ページビュー）
export function logScreenView(screenName: string): void {
  if (!isWeb()) return;
  const w = window as any;
  if (typeof w.gtag !== 'function') return;
  w.gtag('event', 'page_view', {
    page_title: screenName,
    page_location: window.location.href,
    page_path: '/' + screenName,
  });
}

// 任意のイベント
export function logEvent(name: string, params?: Record<string, any>): void {
  if (!isWeb()) return;
  const w = window as any;
  if (typeof w.gtag !== 'function') return;
  w.gtag('event', name, params || {});
}
