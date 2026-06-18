// Google Analytics 4（GA4）計測ユーティリティ（Web専用）
// 計測IDは環境変数 EXPO_PUBLIC_GA_MEASUREMENT_ID（G-XXXXXXXXXX）で設定。
// 未設定時やネイティブでは何もしない安全フォールバック。
import { Platform } from 'react-native';

// GA4の測定IDは公開値（ページソースに露出する）。env未設定でも本番で計測できるよう既定値を持つ。
const GA_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID || 'G-6L3ZD22SLQ';
let initialized = false;

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined';

// gtag.js を読み込み、SPA向けに自動 page_view を無効化して初期化する
export function initAnalytics(): void {
  if (initialized || !isWeb() || !GA_ID) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    w.dataLayer.push(arguments);
  };
  w.gtag('js', new Date());
  // 画面遷移は手動で送るため send_page_view は無効
  w.gtag('config', GA_ID, { send_page_view: false });
}

// 画面表示（SPAの仮想ページビュー）
export function logScreenView(screenName: string): void {
  if (!isWeb()) return;
  const w = window as any;
  if (!w.gtag) return;
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
  if (!w.gtag) return;
  w.gtag('event', name, params || {});
}
