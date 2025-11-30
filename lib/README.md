# ライブラリ・ユーティリティ

## 概要

このディレクトリには、プロジェクト全体で使用するライブラリとユーティリティ関数を格納します。

## ファイル一覧

### `prisma.ts`
Prismaクライアントのシングルトンインスタンスを提供します。

```typescript
import { prisma } from '@/lib/prisma'
```

### `utils.ts`
汎用ユーティリティ関数（cn関数など）を提供します。

```typescript
import { cn } from '@/lib/utils'
```

### `errors.ts`
カスタムエラークラスとエラーハンドリング関数を提供します。

```typescript
import { AppError, ValidationError, NotFoundError } from '@/lib/errors'
```

### `api-response.ts`
API Route Handler用のレスポンス生成関数を提供します。

```typescript
import { successResponse, errorResponse } from '@/lib/api-response'
```

### `validations.ts`
Zodスキーマによるバリデーション定義を提供します。

```typescript
import { registerSchema, createPostSchema } from '@/lib/validations'
```

### `auth-helpers.ts`
認証関連のヘルパー関数を提供します。

```typescript
import { requireAuth, requireAdmin } from '@/lib/auth-helpers'
```

### `slug.ts`
スラッグ生成ユーティリティを提供します。

```typescript
import { generateSlug, generateUniqueSlug } from '@/lib/slug'
```

## 使用方法

すべてのファイルは`@/lib`エイリアスからインポートできます。

```typescript
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { successResponse } from '@/lib/api-response'
```

