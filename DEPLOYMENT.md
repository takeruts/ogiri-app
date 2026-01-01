# Vercelへのデプロイ手順

このドキュメントでは、オオギリパークをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（https://vercel.com でサインアップ）
- Supabaseプロジェクトが設定済み

## デプロイ手順

### 1. Vercelにログイン

https://vercel.com にアクセスしてログインします。

### 2. 新規プロジェクトをインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリ `takeruts/ogiri-app` を選択
3. 「Import」をクリック

### 3. プロジェクト設定

#### Framework Preset
- **Framework Preset**: Other

#### Build Settings
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Root Directory
- そのまま（ルートディレクトリ）

### 4. 環境変数の設定

「Environment Variables」セクションで以下を追加:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**重要**: Supabaseの設定から正しい値をコピーしてください。

### 5. デプロイ

「Deploy」ボタンをクリックしてデプロイを開始します。

### 6. デプロイ完了

数分後、デプロイが完了します。Vercelが自動的にURLを生成します:
- `https://ogiri-app-xxx.vercel.app`

## カスタムドメインの設定（オプション）

### 1. ドメインを追加

1. プロジェクトの「Settings」→「Domains」に移動
2. 「Add Domain」をクリック
3. ドメイン名を入力（例: `ogiripark.com`）

### 2. DNSレコードの設定

Vercelが提供するDNS設定をドメインレジストラで設定:

**Aレコード**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAMEレコード（www）**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL証明書

Vercelが自動的にSSL証明書（Let's Encrypt）を発行します。

## 自動デプロイ

GitHubのmainブランチにプッシュすると、Vercelが自動的に再デプロイします。

```bash
git add .
git commit -m "Update app"
git push origin main
```

## プレビューデプロイ

プルリクエストを作成すると、Vercelが自動的にプレビュー環境を作成します。

## トラブルシューティング

### ビルドエラー

**エラー**: `expo: command not found`
**解決策**: package.jsonに`expo`が依存関係として含まれていることを確認

**エラー**: 環境変数が読み込まれない
**解決策**: Vercelの環境変数設定で`EXPO_PUBLIC_`プレフィックスが正しいか確認

### ランタイムエラー

**エラー**: Supabaseに接続できない
**解決策**: 
1. Vercelの環境変数が正しく設定されているか確認
2. Supabaseプロジェクトが有効か確認
3. ブラウザのコンソールでエラーメッセージを確認

### パフォーマンス

**問題**: 読み込みが遅い
**解決策**:
1. Vercelの「Analytics」で確認
2. 画像を最適化
3. コード分割を検討

## モニタリング

### Vercel Analytics

1. プロジェクトの「Analytics」タブで確認
2. ページビュー、パフォーマンス、エラーを監視

### ログ

1. プロジェクトの「Deployments」タブ
2. 各デプロイの「View Build Logs」でログを確認

## ロールバック

問題が発生した場合:

1. 「Deployments」タブに移動
2. 以前の成功したデプロイを選択
3. 「Promote to Production」をクリック

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Deployment](https://docs.expo.dev/distribution/publishing-websites/)
- [Supabase Documentation](https://supabase.com/docs)

---

デプロイに関する質問は、[GitHubのIssues](https://github.com/takeruts/ogiri-app/issues)で報告してください。
