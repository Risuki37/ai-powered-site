import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { updateTagSchema } from '@/lib/validations'
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
 * タグ更新
 * PUT /api/tags/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const tagId = BigInt(parseInt(id, 10))
    const body = await request.json()

    // バリデーション
    const validationResult = updateTagSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    // 既存のタグを取得
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        posts: {
          where: {
            post: {
              published: true,
            },
          },
        },
      },
    })

    if (!existingTag) {
      return notFoundResponse('タグ')
    }

    const { name } = validationResult.data

    // 更新データの構築
    const updateData: any = {}

    // タグ名の更新
    if (name !== undefined && name !== existingTag.name) {
      // タグ名の重複チェック
      const existingTagByName = await prisma.tag.findUnique({
        where: { name },
      })

      if (existingTagByName && existingTagByName.id !== tagId) {
        return conflictResponse('このタグ名は既に使用されています')
      }

      updateData.name = name

      // スラッグの生成（一意性を保証）
      const slug = await generateUniqueSlug(
        name,
        async (slug) => {
          const existingTagBySlug = await prisma.tag.findUnique({
            where: { slug },
          })
          return !existingTagBySlug || existingTagBySlug.id === tagId
        },
        'tag'
      )
      updateData.slug = slug
    }

    // タグの更新
    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: updateData,
      include: {
        posts: {
          where: {
            post: {
              published: true,
            },
          },
        },
      },
    })

    // レスポンス用のデータ変換
    const formattedTag = {
      id: tag.id.toString(),
      name: tag.name,
      slug: tag.slug,
      postCount: tag.posts.length,
    }

    return successResponse({
      tag: formattedTag,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    if (error instanceof ConflictError) {
      return conflictResponse(error.message)
    }
    return errorResponse(error, 'タグの更新に失敗しました')
  }
}

/**
 * タグ削除
 * DELETE /api/tags/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const tagId = BigInt(parseInt(id, 10))

    // 既存のタグを取得
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        posts: {
          where: {
            post: {
              published: true,
            },
          },
        },
      },
    })

    if (!existingTag) {
      return notFoundResponse('タグ')
    }

    // 関連する記事がある場合でも削除可能（PostTagが自動削除される）

    // タグの削除（関連するPostTagも自動削除される）
    await prisma.tag.delete({
      where: { id: tagId },
    })

    return successResponse({
      message: 'タグを削除しました',
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'タグの削除に失敗しました')
  }
}

