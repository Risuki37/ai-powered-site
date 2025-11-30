import { z } from 'zod'

// ============================================
// 認証関連バリデーション
// ============================================

export const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(
      /[A-Za-z0-9]/,
      'パスワードは英数字を含む必要があります'
    ),
  name: z.string().min(1, 'ユーザー名を入力してください').max(255),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
})

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(
      /[A-Za-z0-9]/,
      'パスワードは英数字を含む必要があります'
    ),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(
      /[A-Za-z0-9]/,
      'パスワードは英数字を含む必要があります'
    ),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(255, '名前は255文字以内である必要があります').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').max(255, 'メールアドレスは255文字以内である必要があります').optional(),
  image: z.string().url('有効な画像URLではありません').max(500, '画像URLは500文字以内である必要があります').optional().nullable(),
  bio: z.string().max(1000, '自己紹介は1000文字以内である必要があります').optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ============================================
// ブログ関連バリデーション
// ============================================

export const createPostSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(200),
  content: z.string().min(1, '本文を入力してください'),
  excerpt: z.string().max(500).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  tagIds: z.array(z.number().int().positive()).optional(),
  published: z.boolean().default(false),
})

export const updatePostSchema = createPostSchema.partial()

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

// ============================================
// Todo関連バリデーション
// ============================================

export const createTodoSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100),
  description: z.string().max(1000).optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  dueDate: z
    .union([
      z.string().datetime(), // ISO形式
      z.string(), // datetime-local形式も許可
      z.null(),
    ])
    .optional()
    .nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  projectId: z.number().int().positive().optional().nullable(),
})

export const updateTodoSchema = createTodoSchema
  .extend({
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  })
  .partial()

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>

// ============================================
// 共通バリデーション
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const idSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// ============================================
// カテゴリ・タグ関連バリデーション
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名を入力してください').max(100, 'カテゴリ名は100文字以内である必要があります'),
  description: z.string().max(1000, '説明は1000文字以内である必要があります').optional().nullable(),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

export const createTagSchema = z.object({
  name: z.string().min(1, 'タグ名を入力してください').max(50, 'タグ名は50文字以内である必要があります'),
})

export const updateTagSchema = createTagSchema.partial()

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
