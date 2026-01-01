# オオギリハブ (Ogiri Hub)

みんなで楽しむ大喜利のモバイル・ウェブアプリケーション

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-green.svg)](https://supabase.com/)

## 概要

オオギリハブは、ユーザーがお題を投稿し、他のユーザーがそのお題に対して面白い回答を投稿できるソーシャルアプリです。いいね・よくないねの評価システムとランキング機能で、最も面白い回答を見つけることができます。

## 主な機能

### ユーザー機能
- **ユーザー登録・ログイン**: Supabase Authによる安全な認証
- **お題投稿**: 画像付きでお題を投稿可能
- **回答投稿**: 1つのお題に対して最大3つまで回答可能
- **いいね・よくないね**: お題と回答に対する評価機能
- **ランキング**: 人気のお題と回答をランキング表示
- **マイページ**: 自分の投稿したお題と回答を一覧表示

### 管理者機能
- **管理者パネル**: 不適切なコンテンツの削除
- **お題管理**: 全てのお題を検索・削除
- **回答管理**: 全ての回答を検索・削除
- **ユーザー管理**: ユーザーアカウントの無効化

## 技術スタック

- **フロントエンド**: React Native with Expo
- **言語**: TypeScript
- **バックエンド**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage
- **ナビゲーション**: React Navigation
- **プラットフォーム**: iOS, Android, Web

## セットアップ

### 必要な環境

- Node.js (v16以上)
- npm または yarn
- Expo CLI
- Supabaseアカウント

### インストール手順

1. リポジトリをクローン

\`\`\`bash
git clone https://github.com/takeruts/ogiri-app.git
cd ogiri-app
\`\`\`

2. 依存パッケージをインストール

\`\`\`bash
npm install
\`\`\`

3. 環境変数の設定

\`.env.example\`を\`.env\`にコピーし、Supabaseの認証情報を設定します。

\`\`\`bash
cp .env.example .env
\`\`\`

\`.env\`ファイルに以下の情報を記入:

\`\`\`
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

4. Supabaseのデータベース設定

Supabase SQL Editorで以下のSQLファイルを順番に実行:

\`\`\`bash
# データベーススキーマの作成
supabase/schema.sql

# 管理者機能の追加
supabase/add_admin.sql
\`\`\`

5. ストレージバケットの作成

Supabase Dashboardで以下のバケットを作成:
- バケット名: \`topic-images\`
- 公開設定: Public

6. アプリの起動

\`\`\`bash
# 開発サーバーを起動
npm start

# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web ブラウザ
npm run web
\`\`\`

## 管理者の設定

初回ユーザーを管理者にするには、Supabase SQL Editorで以下を実行:

\`\`\`sql
UPDATE profiles SET is_admin = true WHERE email = 'your_email@example.com';
\`\`\`

## プロジェクト構成

\`\`\`
ogiri-app/
├── src/
│   ├── contexts/         # React Context (認証など)
│   ├── lib/             # ライブラリ設定 (Supabase)
│   ├── navigation/      # ナビゲーション設定
│   └── screens/         # 画面コンポーネント
│       ├── AuthScreen.tsx          # ログイン・登録画面
│       ├── HomeScreen.tsx          # ホーム画面
│       ├── CreateTopicScreen.tsx   # お題投稿画面
│       ├── TopicDetailScreen.tsx   # お題詳細画面
│       ├── CreateAnswerScreen.tsx  # 回答投稿画面
│       ├── RankingScreen.tsx       # ランキング画面
│       ├── MyPageScreen.tsx        # マイページ
│       └── AdminScreen.tsx         # 管理者画面
├── supabase/            # データベーススキーマ
├── App.tsx             # アプリエントリーポイント
└── package.json        # 依存関係
\`\`\`

## データベーススキーマ

### 主要テーブル

- **profiles**: ユーザープロフィール
- **topics**: お題
- **answers**: 回答
- **topic_reactions**: お題への反応 (いいね・よくないね)
- **answer_reactions**: 回答への反応 (いいね・よくないね)

詳細は \`supabase/schema.sql\` を参照してください。

## セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- ユーザーは自分の投稿のみ編集・削除可能
- 管理者は全てのコンテンツを管理可能
- 画像アップロードのサイズ制限とバリデーション

## ライセンス

ISC

## サポート

問題や質問がある場合は、[GitHubのIssues](https://github.com/takeruts/ogiri-app/issues)で報告してください。

## 開発者

オオギリハブ開発チーム

---

楽しい大喜利ライフをお楽しみください！
