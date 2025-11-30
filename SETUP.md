# 開発環境セットアップガイド

## クイックスタート

### 1. 依存関係のインストール

```bash
cd code
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成（`.env.example`をコピーして使用）

```bash
cp .env.example .env.local
```

`.env.local`を編集して、実際の値を設定:

```env
# データベース（XREAサーバーの接続情報を設定）
DATABASE_URL="mysql://username:password@host:port/database?schema=public"

# NextAuth（秘密鍵を生成）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AI API Keys（必要に応じて設定）
OPENAI_API_KEY="your-openai-api-key"
GEMINI_API_KEY="your-gemini-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# 環境
NODE_ENV="development"
```

**NextAuth Secretの生成**:
```bash
openssl rand -base64 32
```

### 3. Prismaクライアントの生成

```bash
npm run db:generate
```

### 4. データベースマイグレーション

```bash
npm run db:migrate
```

### 5. 初期データの投入（オプション）

```bash
npm run db:seed
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## トラブルシューティング

### Prismaクライアントの生成エラー

```bash
# Prismaスキーマを再生成
npm run db:generate
```

### データベース接続エラー

1. `.env.local`の`DATABASE_URL`を確認
2. XREAサーバーの接続情報を確認
3. 外部接続が許可されているか確認

### ポートが使用中

```bash
# 別のポートで起動
PORT=3001 npm run dev
```

## 次のステップ

環境構築が完了したら、以下を参照:

- [ネクストアクション](../ネクストアクション.md)
- [開発環境構築手順書](../docs/開発環境構築手順書.md)

