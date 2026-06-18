# お笑い偏差値診断

AIがあなたのお笑いセンスを診断するSNS世代向けエンタメアプリ

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-green.svg)](https://supabase.com/)

## 概要

お笑い偏差値診断は、AIがあなたのお笑いセンスを診断するエンタメアプリです。お題に回答すると、Gemini AIが**お笑い偏差値・全国上位パーセント・お笑いタイプ・4軸（創造力／毒舌力／シュール力／共感力）**を診断。AI審査員（ラナ／モモ／ミュー）がコメントし、結果は**SNSシェア画像**としてワンタップで投稿できます。

ダーク×ネオン（紫→ピンク）の世界観で、MBTI × Spotify Wrapped × TikTok診断のような体験を目指しています。

**URL**: https://www.ogirihub.com/

## 主な機能

### ゲームモード
- **診断モード**: Gemini AIが多様なジャンルからお題を自動生成
- **写真で一言モード**: Unsplash APIからランダムな写真を取得し、一言回答をAI採点

### AI診断（採点結果）
- **お笑い偏差値**: 100点満点のスコアを偏差値・全国上位パーセントに変換して表示
- **お笑いタイプ診断**: 「天才ひらめき型」などAIがセンスを命名
- **4軸スコア**: 創造力／毒舌力／シュール力／共感力を★で可視化
- **AI ANALYSIS**: Spotify Wrapped風の一言分析
- **AI審査員**: ラナ／モモ／ミューが結果に応じてコメント＆ヒント
- **採点基準表示**: いつでも採点基準を確認可能

### ユーザー機能
- **ゲストプレイ**: ログイン不要で即プレイ可能
- **ユーザー登録**: メールまたはGoogleアカウントでログイン
- **パスワードリセット**: メールでパスワードリセット可能
- **プロフィール編集**: ニックネームの変更が可能
- **ログインエラー表示**: 失敗理由を日本語で表示

### お題投稿機能
- **お題の投稿**: ユーザーが自分で考えたお題を投稿可能
- **AI採点**: 投稿されたお題をAIが採点し、理由も表示
- **ストック機能**: 86点以上のお題は自動的にストックに追加
- **投稿者表示**: ストックされたお題には投稿者のニックネームと点数を表示

### ランキング・共有
- **今週の天才 TOP100**: カード型ランキング。順位に応じて称号（殿堂入り／天才／秀才／実力派）とバッジ（👑🥈🥉🔥⭐✨）を表示
- **人気お題ランキング**: 挑戦者数の多いお題TOP100を表示
- **お題に再挑戦**: ランキングから同じお題に挑戦可能
- **回答時間計測**: 同点の場合は回答時間が短い方が上位
- **SNSシェア画像の自動生成**: 診断結果を縦長カード画像（Instagram／TikTok比率）に書き出し、Web Share API対応端末ではワンタップ共有、非対応では画像ダウンロード
- **X（Twitter）テキスト投稿**: 偏差値・タイプ付きのテキストをワンタップ投稿

## 採点基準

AIは以下の観点で0〜100点で採点します:

| 観点 | 配点 | 説明 |
|------|------|------|
| 笑いのインパクト | 50点 | 思わず笑ってしまう破壊力、クスッとくる面白さ（最重視） |
| 意外性・裏切り | 20点 | 予想外の角度からの回答、期待を良い意味で裏切る発想 |
| お題との関連性 | 20点 | お題の意図を理解し、的確に応えているか |
| 表現の巧みさ | 10点 | 言葉選び、テンポ、簡潔さなどの表現力 |

### 高得点のコツ

- 王道の回答より、少しズラした視点が高得点のコツ
- 長い説明より、短く切れ味のある回答を
- お題のキーワードを活かしつつ、予想外の展開を

## 技術スタック

- **フロントエンド**: React Native with Expo (Web)
- **言語**: TypeScript
- **AI**: Google Gemini API（テキスト＆画像認識）
- **写真**: Unsplash API
- **バックエンド**: Supabase (PostgreSQL)
- **認証**: Supabase Auth（メール認証、Google OAuth）
- **ナビゲーション**: React Navigation

## セットアップ

### 必要な環境

- Node.js (v16以上)
- npm
- Supabaseアカウント
- Google Gemini APIキー
- Unsplash APIキー（写真で一言モード用）

### インストール手順

1. リポジトリをクローン

```bash
git clone https://github.com/takeruts/ogiri-app.git
cd ogiri-app
```

2. 依存パッケージをインストール

```bash
npm install
```

3. 環境変数の設定

`.env.example`を`.env`にコピーし、認証情報を設定します。

```bash
cp .env.example .env
```

`.env`ファイルに以下の情報を記入:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

4. Supabaseのデータベース設定

Supabase SQL Editorで以下のSQLファイルを順番に実行:

```
supabase/migrations/create_game_history.sql
supabase/migrations/002_update_schema.sql
supabase/migrations/003_nickname_and_rankings.sql
```

5. アプリの起動

```bash
# Web ブラウザ
npm run web
```

## プロジェクト構成

```
ogiri-app/
├── src/
│   ├── contexts/         # React Context (認証)
│   ├── lib/              # ライブラリ設定 (Supabase)
│   ├── navigation/       # ナビゲーション設定
│   ├── constants/        # テーマ（theme.ts: ダーク診断パレット＋diagトークン）
│   ├── utils/            # ユーティリティ
│   │   └── shareImage.ts       # 診断結果の縦長シェア画像をCanvasで生成
│   ├── services/         # サービス層
│   │   ├── geminiService.ts    # Gemini API連携（採点＋お笑いタイプ／4軸／分析）
│   │   ├── unsplashService.ts  # Unsplash API連携
│   │   └── nicknameService.ts  # ニックネーム管理
│   └── screens/          # 画面コンポーネント
│       ├── HomeScreen.tsx       # ホーム画面
│       ├── GameScreen.tsx       # 診断モード
│       ├── PhotoGameScreen.tsx  # 写真で一言モード
│       ├── HistoryScreen.tsx    # ランキング・履歴画面
│       ├── MyPageScreen.tsx     # マイページ
│       ├── ProfileEditScreen.tsx # プロフィール編集
│       ├── AuthScreen.tsx       # 認証画面
│       ├── LoginScreen.tsx      # ログイン（Google対応・エラー表示）
│       └── SignUpScreen.tsx     # 新規登録
├── supabase/             # データベースマイグレーション
├── public/               # 静的ファイル
├── scripts/              # ブランド画像生成（generate-icons.js）／プレビュー
├── App.tsx               # アプリエントリーポイント
└── package.json          # 依存関係
```

## データベーススキーマ

### 主要テーブル

- **game_history**: ゲーム結果（お題、回答、スコア、回答時間）
- **user_profiles**: ユーザープロフィール
- **nicknames**: ニックネーム管理（ユニーク制約）

### ビュー

- **top_scores**: 高得点TOP100
- **popular_topics**: 人気お題TOP100
- **topic_rankings**: お題別ランキング
- **user_rankings**: ユーザーランキング

## セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- ニックネームの一意性をデータベースレベルで保証
- 匿名ユーザーはデバイスIDで識別

## ライセンス

ISC

## 開発者

お笑い偏差値診断開発チーム
