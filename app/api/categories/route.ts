import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { createCategorySchema } from '@/lib/validations'
import { generateUniqueSlug } from '@/lib/slug'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
} from '@/lib/api-response'
import { UnauthorizedError, ConflictError } from '@/lib/errors'

/**
 * カテゴリ一覧取得
 * GET /api/categories
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    // レスポンス用のデータ変換
    const formattedCategories = categories.map((category) => ({
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      postCount: category._count.posts,
    }))

    return successResponse({
      categories: formattedCategories,
    })
  } catch (error) {
    return errorResponse(error, 'カテゴリ一覧の取得に失敗しました')
  }
}

/**
 * カテゴリ作成
 * POST /api/categories
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request) // 認証チェック
    const body = await request.json()

    // バリデーション
    const validationResult = createCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const { name, description } = validationResult.data

    // カテゴリ名の重複チェック
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    })

    if (existingCategory) {
      return conflictResponse('このカテゴリ名は既に使用されています')
    }

    // スラッグの生成（一意性を保証）
    const slug = await generateUniqueSlug(
      name,
      async (slug) => {
        const existingCategoryBySlug = await prisma.category.findUnique({
          where: { slug },
        })
        return !existingCategoryBySlug
      },
      'category'
    )

    // カテゴリの作成
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    // レスポンス用のデータ変換
    const formattedCategory = {
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      postCount: category._count.posts,
    }

    return successResponse(
      {
        category: formattedCategory,
      },
      201
    )
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    if (error instanceof ConflictError) {
      return conflictResponse(error.message)
    }
    return errorResponse(error, 'カテゴリの作成に失敗しました')
  }
}

