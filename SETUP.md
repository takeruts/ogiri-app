# セットアップガイド

このガイドでは、お笑い偏差値診断を動かすための詳細な手順を説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります：

- Node.js (v18以上推奨)
- npm または yarn
- Android Studio（Androidエミュレータを使う場合）
- Xcode（iOSシミュレータを使う場合、Macのみ）

## ステップ1: プロジェクトのクローン

既にクローン済みの場合はスキップしてください。

```bash
git clone https://github.com/takeruts/ogiri-app.git
cd ogiri-app
```

## ステップ2: 依存関係のインストール

```bash
npm install
```

## ステップ3: Supabaseプロジェクトの作成

### 3-1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリックして無料アカウントを作成
3. GitHubアカウントでサインアップ（推奨）

### 3-2. 新しいプロジェクトの作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力:
   - **Name**: `ogiri-app`（任意の名前）
   - **Database Password**: 強力なパスワードを生成（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本の場合）
3. 「Create new project」をクリック
4. プロジェクトの作成が完了するまで待つ（1-2分程度）

### 3-3. データベーススキーマの作成

1. Supabaseダッシュボードで左メニューの「SQL Editor」をクリック
2. 「New query」をクリック
3. プロジェクトの `supabase/schema.sql` ファイルの内容をコピー＆ペースト
4. 「Run」ボタンをクリックしてSQLを実行
5. 成功メッセージが表示されることを確認

### 3-4. API設定の確認

1. 左メニューの「Settings」→「API」をクリック
2. 以下の情報をメモ:
   - **Project URL**: `https://xxxxx.supabase.co` の形式
   - **anon public** キー（API Keysセクション内）

## ステップ4: 環境変数の設定

### 4-1. .envファイルの作成

プロジェクトのルートディレクトリで以下を実行:

```bash
# Windowsの場合
copy .env.example .env

# Mac/Linuxの場合
cp .env.example .env
```

### 4-2. .envファイルの編集

`.env` ファイルをテキストエディタで開き、以下の値をSupabaseダッシュボードから取得した情報に置き換えます:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**重要**: 実際の値に置き換えてください。`xxxxx` や `your_actual_anon_key_here` のままだと動作しません。

## ステップ5: アプリの起動

### 5-1. Expo開発サーバーの起動

```bash
npm start
```

以下のようなQRコードとメニューが表示されます:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

### 5-2. アプリの実行方法

#### オプション1: Expo Goアプリ（推奨・初心者向け）

1. スマートフォンに「Expo Go」アプリをインストール
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
2. Expo Goアプリを開く
3. ターミナルに表示されたQRコードをスキャン
4. アプリが起動します

#### オプション2: Androidエミュレータ

1. Android Studioをインストール
2. AVD（Android Virtual Device）を作成・起動
3. ターミナルで `a` キーを押す
4. アプリがエミュレータで起動します

#### オプション3: iOSシミュレータ（Macのみ）

1. Xcodeをインストール
2. ターミナルで `i` キーを押す
3. アプリがシミュレータで起動します

## ステップ6: 動作確認

### 6-1. アカウント登録

1. アプリが起動したら「アカウントをお持ちでない方はこちら」をタップ
2. 以下の情報を入力:
   - ユーザー名: 任意の名前
   - メールアドレス: 有効なメールアドレス
   - パスワード: 6文字以上
3. 「登録」ボタンをタップ
4. 登録成功メッセージが表示されます

### 6-2. ログイン

1. 登録したメールアドレスとパスワードでログイン
2. ホーム画面が表示されます

### 6-3. お題を投稿

1. 右下の「+」ボタンをタップ
2. お題のタイトルと説明を入力
3. 「お題を投稿」ボタンをタップ
4. ホーム画面に戻り、投稿したお題が表示されます

### 6-4. 回答を投稿

1. お題をタップして詳細画面を開く
2. 右下の「+」ボタンをタップ
3. 回答を入力
4. 「回答を投稿」ボタンをタップ

## トラブルシューティング

### エラー: "Unable to resolve module"

```bash
# キャッシュをクリア
npm start -- --clear
```

### エラー: Supabaseに接続できない

1. `.env` ファイルが正しく作成されているか確認
2. 環境変数の値が正しいか確認（余分なスペースがないか）
3. Supabaseプロジェクトが正しく起動しているか確認

### エラー: データベースエラー

1. `supabase/schema.sql` が正しく実行されているか確認
2. SupabaseダッシュボードのSQL Editorでエラーがないか確認

### アプリが起動しない

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm start
```

## 次のステップ

アプリが正常に動作したら、以下を試してみてください：

1. 複数のお題と回答を投稿
2. いいね/イマイチ機能を試す
3. ランキング画面でトップの回答を確認
4. マイページで自分の投稿履歴を確認

## サポート

問題が発生した場合は、以下を確認してください：

- [README.md](README.md) - プロジェクトの概要
- GitHubのIssues - 既知の問題と解決策
