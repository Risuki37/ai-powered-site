import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { updateCategorySchema } from '@/lib/validations'
import { generateUniqueSlug } from '@/lib/slug'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
} from '@/lib/api-response'
import { UnauthorizedError, ConflictError } from '@/lib/errors'

/**
 * カテゴリ更新
 * PUT /api/categories/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request) // 認証チェック
    const { id } = await params
    const categoryId = BigInt(parseInt(id, 10))
    const body = await request.json()

    // バリデーション
    const validationResult = updateCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    // 既存のカテゴリを取得
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!existingCategory) {
      return notFoundResponse('カテゴリ')
    }

    const { name, description } = validationResult.data

    // 更新データの構築
    const updateData: Record<string, string | null> = {}

    // カテゴリ名の更新
    if (name !== undefined && name !== existingCategory.name) {
      // カテゴリ名の重複チェック
      const existingCategoryByName = await prisma.category.findUnique({
        where: { name },
      })

      if (existingCategoryByName && existingCategoryByName.id !== categoryId) {
        return conflictResponse('このカテゴリ名は既に使用されています')
      }

      updateData.name = name

      // スラッグの生成（一意性を保証）
      const slug = await generateUniqueSlug(
        name,
        async (slug) => {
          const existingCategoryBySlug = await prisma.category.findUnique({
            where: { slug },
          })
          return !existingCategoryBySlug || existingCategoryBySlug.id === categoryId
        },
        'category'
      )
      updateData.slug = slug
    }

    // 説明の更新
    if (description !== undefined) {
      updateData.description = description || null
    }

    // カテゴリの更新
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
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

    return successResponse({
      category: formattedCategory,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    if (error instanceof ConflictError) {
      return conflictResponse(error.message)
    }
    return errorResponse(error, 'カテゴリの更新に失敗しました')
  }
}

/**
 * カテゴリ削除
 * DELETE /api/categories/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request) // 認証チェック
    const { id } = await params
    const categoryId = BigInt(parseInt(id, 10))

    // 既存のカテゴリを取得
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!existingCategory) {
      return notFoundResponse('カテゴリ')
    }

    // 関連する記事がある場合は削除を拒否（将来的には、記事を別のカテゴリに移動する機能を追加可能）
    if (existingCategory._count.posts > 0) {
      return errorResponse(
        new Error('このカテゴリには記事が関連付けられているため削除できません'),
        'このカテゴリには記事が関連付けられているため削除できません',
        409
      )
    }

    // カテゴリの削除
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return successResponse({
      message: 'カテゴリを削除しました',
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'カテゴリの削除に失敗しました')
  }
}

