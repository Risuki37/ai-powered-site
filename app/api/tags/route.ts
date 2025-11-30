import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { createTagSchema } from '@/lib/validations'
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
 * タグ一覧取得
 * GET /api/tags
 */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
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
    const formattedTags = tags.map((tag) => ({
      id: tag.id.toString(),
      name: tag.name,
      slug: tag.slug,
      postCount: tag.posts.length,
    }))

    return successResponse({
      tags: formattedTags,
    })
  } catch (error) {
    return errorResponse(error, 'タグ一覧の取得に失敗しました')
  }
}

/**
 * タグ作成
 * POST /api/tags
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request) // 認証チェック
    const body = await request.json()

    // バリデーション
    const validationResult = createTagSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const { name } = validationResult.data

    // タグ名の重複チェック
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    })

    if (existingTag) {
      return conflictResponse('このタグ名は既に使用されています')
    }

    // スラッグの生成（一意性を保証）
    const slug = await generateUniqueSlug(
      name,
      async (slug) => {
        const existingTagBySlug = await prisma.tag.findUnique({
          where: { slug },
        })
        return !existingTagBySlug
      },
      'tag'
    )

    // タグの作成
    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
      },
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

    return successResponse(
      {
        tag: formattedTag,
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
    return errorResponse(error, 'タグの作成に失敗しました')
  }
}

