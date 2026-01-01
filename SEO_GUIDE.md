# SEO対策ガイド

オオギリパークのSEO（検索エンジン最適化）対策について説明します。

## 実装済みのSEO対策

### 1. メタタグの最適化 (public/index.html)

以下のメタタグを実装しています:

- **基本メタタグ**
  - タイトル: 「オオギリパーク - みんなで楽しむお題と回答投稿コミュニティ」
  - ディスクリプション: 150文字以内の魅力的な説明
  - キーワード: オオギリパーク、大喜利、お題、回答、コミュニティなど

- **Open Graph (Facebook/SNS用)**
  - og:title, og:description, og:image
  - SNSでシェアされた際の見た目を最適化

- **Twitter Card**
  - summary_large_image形式
  - Twitter上での表示を最適化

- **構造化データ (JSON-LD)**
  - WebApplicationスキーマ
  - Googleの検索結果での表示を改善

### 2. サイトマップ (public/sitemap.xml)

検索エンジンにサイト構造を伝えるためのXMLファイルです。

主要ページ:
- ホームページ (優先度: 1.0)
- ランキング (優先度: 0.8)
- お題一覧 (優先度: 0.8)
- その他の静的ページ

### 3. robots.txt (public/robots.txt)

検索エンジンのクロールを制御:
- 管理者ページはクロール禁止
- APIエンドポイントはクロール禁止
- 主要ページはクロール許可

### 4. アプリマニフェスト (app.json)

PWA（Progressive Web App）対応:
- アプリ名、説明文
- アイコン、スプラッシュ画面
- テーマカラー (#007AFF)
- 日本語設定 (lang: "ja")

### 5. パフォーマンス最適化

- ローディング画面の実装
- レスポンシブデザイン
- モバイルファーストアプローチ

## 追加で行うべきSEO対策

### 1. Google Search Consoleの設定

```
1. https://search.google.com/search-console にアクセス
2. プロパティを追加（ogiri-app.com）
3. 所有権の確認
4. sitemap.xmlを送信
```

### 2. Google Analyticsの導入

`App.tsx`にGoogleアナリティクスを追加:

```typescript
// npm install @react-native-google-analytics/google-analytics
import Analytics from '@react-native-google-analytics/google-analytics';

// 初期化
Analytics.setTrackerId('UA-XXXXXXXXX-X');
```

### 3. OGP画像の作成

`public/og-image.png` を作成:
- 推奨サイズ: 1200x630px
- ファイルサイズ: 1MB以下
- アプリの特徴が分かるデザイン

### 4. ファビコンの作成

以下のファビコンを作成:
- `public/favicon.png` (32x32px)
- `public/favicon-16x16.png` (16x16px)
- `public/favicon-32x32.png` (32x32px)
- `public/apple-touch-icon.png` (180x180px)

### 5. コンテンツの最適化

- **URLの最適化**: 読みやすく意味のあるURL構造
- **見出しタグの適切な使用**: H1, H2, H3を階層的に使用
- **alt属性の設定**: 画像にはalt属性を必ず設定
- **内部リンク**: 関連するページへのリンクを設置

### 6. ページ速度の最適化

```bash
# 画像の最適化
npm install -D imagemin imagemin-mozjpeg imagemin-pngquant

# コード分割
# React.lazy()とSuspenseを使用

# キャッシング戦略の実装
```

### 7. モバイルフレンドリー対応

- タッチターゲットのサイズを適切に
- フォントサイズは16px以上
- ビューポートの設定 (完了済み)

### 8. HTTPS対応

本番環境では必ずHTTPSを使用:
```
- SSL証明書の取得（Let's Encryptなど）
- HTTPSリダイレクトの設定
```

### 9. 定期的なコンテンツ更新

- ブログやニュースセクションの追加
- 新機能のアナウンス
- ユーザー事例の紹介

### 10. ソーシャルメディア連携

- シェアボタンの設置
- Twitterカードのテスト
- Facebook OGPのテスト

## SEOチェックリスト

公開前に以下を確認:

- [ ] メタタグが全ページに設定されている
- [ ] OGP画像が作成されている
- [ ] ファビコンが設置されている
- [ ] sitemap.xmlが正しく生成されている
- [ ] robots.txtが適切に設定されている
- [ ] Google Search Consoleに登録済み
- [ ] Google Analyticsが動作している
- [ ] ページ読み込み速度が3秒以内
- [ ] モバイルで正しく表示される
- [ ] HTTPSが有効になっている

## SEO測定ツール

定期的に以下のツールでチェック:

1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/

2. **Google Mobile-Friendly Test**
   - https://search.google.com/test/mobile-friendly

3. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator

4. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/

5. **SEOチェキ**
   - https://seocheki.net/

## まとめ

これらのSEO対策により、検索エンジンでの露出が改善され、より多くのユーザーにオオギリパークを見つけてもらえます。定期的にアナリティクスを確認し、改善を続けていきましょう。
