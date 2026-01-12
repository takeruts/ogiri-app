# 壁打ちオオギリ

AIと大喜利の練習ができるウェブアプリ

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-green.svg)](https://supabase.com/)

## 概要

壁打ちオオギリは、AIが出すお題に挑戦して大喜利の腕を磨けるアプリです。Gemini AIがお題を生成し、あなたの回答を採点してヒントもくれます。

**URL**: https://www.ogirihub.com/

## 主な機能

- **AIお題生成**: Gemini AIが多様なジャンルからお題を自動生成
- **AI採点**: 明確な採点基準に基づき0-100点で採点し、コメントとヒントを提供
- **採点基準表示**: いつでも採点基準を確認できるモーダル機能
- **ゲストプレイ**: ログイン不要で即プレイ可能
- **ユーザー登録**: ログインすると履歴が残りランキングに参加可能
- **TOP30ランキング**: 高得点の回答をお題・ニックネーム・回答時間付きで表示
- **人気お題ランキング**: 挑戦者数の多いお題TOP30を表示
- **お題に再挑戦**: ランキングから同じお題に挑戦可能
- **回答時間計測**: 同点の場合は回答時間が短い方が上位

## 採点基準

AIは以下の観点で0〜100点で採点します:

| 観点 | 配点 | 説明 |
|------|------|------|
| 意外性・裏切り | 40点 | 予想外の角度からの回答、期待を良い意味で裏切る発想 |
| 笑いのインパクト | 30点 | 思わず笑ってしまう破壊力、クスッとくる面白さ |
| お題との関連性 | 20点 | お題の意図を理解し、的確に応えているか |
| 表現の巧みさ | 10点 | 言葉選び、テンポ、簡潔さなどの表現力 |

### 高得点のコツ

- 王道の回答より、少しズラした視点が高得点のコツ
- 長い説明より、短く切れ味のある回答を
- お題のキーワードを活かしつつ、予想外の展開を

## 技術スタック

- **フロントエンド**: React Native with Expo (Web)
- **言語**: TypeScript
- **AI**: Google Gemini API
- **バックエンド**: Supabase (PostgreSQL)
- **認証**: Supabase Auth（オプション）
- **ナビゲーション**: React Navigation

## セットアップ

### 必要な環境

- Node.js (v16以上)
- npm
- Supabaseアカウント
- Google Gemini APIキー

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
│   ├── services/         # サービス層
│   │   ├── geminiService.ts    # Gemini API連携
│   │   └── nicknameService.ts  # ニックネーム管理
│   ├── styles/           # 共通スタイル
│   └── screens/          # 画面コンポーネント
│       ├── HomeScreen.tsx       # ホーム画面
│       ├── GameScreen.tsx       # ゲーム画面
│       ├── HistoryScreen.tsx    # ランキング・履歴画面
│       └── MyPageScreen.tsx     # マイページ
├── supabase/             # データベースマイグレーション
├── public/               # 静的ファイル
├── App.tsx               # アプリエントリーポイント
└── package.json          # 依存関係
```

## データベーススキーマ

### 主要テーブル

- **game_history**: ゲーム結果（お題、回答、スコア、回答時間）
- **user_profiles**: ユーザープロフィール
- **nicknames**: ニックネーム管理（ユニーク制約）

### ビュー

- **top_scores**: 高得点TOP30
- **popular_topics**: 人気お題TOP30
- **topic_rankings**: お題別ランキング
- **user_rankings**: ユーザーランキング

## セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- ニックネームの一意性をデータベースレベルで保証
- 匿名ユーザーはデバイスIDで識別

## ライセンス

ISC

## 開発者

壁打ちオオギリ開発チーム
