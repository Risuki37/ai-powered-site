# AI構成サイト - ソースコード

## プロジェクト概要

全てAIによって構成・運営されている革新的なWebサイトのソースコードです。

## 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UIライブラリ**: React
- **スタイリング**: Tailwind CSS
- **データベース**: MySQL (Prisma ORM)
- **認証**: NextAuth.js v5
- **バリデーション**: Zod

## 開発環境セットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上
- MySQL データベース（XREAサーバー）

### セットアップ手順

1. **依存関係のインストール**

```bash
npm install
```

2. **環境変数の設定**

`.env.local`ファイルを作成し、以下を設定:

```env
DATABASE_URL="mysql://username:password@host:port/database?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
OPENAI_API_KEY="your-openai-api-key"
GEMINI_API_KEY="your-gemini-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
NODE_ENV="development"
```

3. **Prismaクライアントの生成**

```bash
npm run db:generate
```

4. **データベースマイグレーション**

```bash
npm run db:migrate
```

5. **初期データの投入（オプション）**

```bash
npm run db:seed
```

6. **開発サーバーの起動**

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルド
- `npm run start` - 本番サーバーを起動
- `npm run lint` - ESLintでコードをチェック
- `npm run type-check` - TypeScriptの型チェック
- `npm run format` - Prettierでコードをフォーマット
- `npm run db:generate` - Prismaクライアントを生成
- `npm run db:migrate` - データベースマイグレーション
- `npm run db:studio` - Prisma Studioを起動
- `npm run db:seed` - 初期データを投入

## プロジェクト構造

```
code/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ
│   ├── api/               # API Routes
│   ├── auth/              # 認証関連ページ
│   ├── blog/              # ブログ関連ページ
│   └── todos/             # Todo関連ページ
├── components/            # Reactコンポーネント
│   ├── ui/                # 基本UIコンポーネント
│   ├── auth/              # 認証コンポーネント
│   ├── blog/              # ブログコンポーネント
│   └── todos/             # Todoコンポーネント
├── lib/                   # ユーティリティ・ライブラリ
│   ├── prisma.ts          # Prismaクライアント
│   ├── auth.ts            # NextAuth設定
│   └── utils.ts           # 汎用ユーティリティ
├── prisma/                # Prisma設定
│   ├── schema.prisma      # データベーススキーマ
│   └── seed.ts            # 初期データ投入スクリプト
├── types/                 # TypeScript型定義
└── public/                # 静的ファイル
```

## コーディング規約

詳細は [コーディング規約](../docs/コーディング規約.md) を参照してください。

## 参照資料

- [設計書](../design/)
- [要件定義書](../docs/requirements/)
- [開発環境構築手順書](../docs/開発環境構築手順書.md)

## ライセンス

Private
