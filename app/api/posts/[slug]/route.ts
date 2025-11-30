import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'
import { updatePostSchema } from '@/lib/validations'
import { requireAuth, getSession } from '@/lib/auth-helpers'
import { generateUniqueSlug } from '@/lib/slug'
import { UnauthorizedError, ForbiddenError } from '@/lib/errors'

/**
 * 記事詳細取得
 * GET /api/posts/[slug]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // 認証情報を取得（オプション）
    const session = await getSession(request)

    // 記事の取得条件を決定
    const whereClause: {
      slug: string
      published?: boolean
      publishedAt?: { not: null } | null
      OR?: Array<{ published: boolean; publishedAt: { not: null } } | { authorId: bigint }>
    } = {
      slug,
    }

    // 認証されていない場合、または記事の所有者でない場合は公開済みのみ
    if (!session) {
      whereClause.published = true
      whereClause.publishedAt = { not: null }
    } else {
      // 認証済みユーザーの場合、自分の記事（非公開も含む）または公開済み記事を取得可能
      whereClause.OR = [
        {
          published: true,
          publishedAt: { not: null },
        },
        {
          authorId: BigInt(session.userId),
        },
      ]
    }

    // 記事の取得
    const post = await prisma.post.findFirst({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return notFoundResponse('記事')
    }

    // レスポンス用のデータ変換
    const formattedPost = {
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      published: post.published,
      author: {
        id: post.author.id.toString(),
        name: post.author.name,
        image: post.author.image,
      },
      category: post.category
        ? {
            id: post.category.id.toString(),
            name: post.category.name,
            slug: post.category.slug,
          }
        : null,
      tags: post.tags.map((pt) => ({
        id: pt.tag.id.toString(),
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
      publishedAt: post.publishedAt?.toISOString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }

    return successResponse({
      post: formattedPost,
    })
  } catch (error) {
    return errorResponse(error, '記事詳細の取得に失敗しました')
  }
}

/**
 * 記事更新
 * PUT /api/posts/[slug]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const { slug } = await params
    const body = await request.json()

    // 記事の存在確認と所有権チェック
    const existingPost = await prisma.post.findUnique({
      where: { slug },
      include: {
        tags: true,
      },
    })

    if (!existingPost) {
      return notFoundResponse('記事')
    }

    // 所有権チェック（自分の記事のみ編集可能）
    if (Number(existingPost.authorId) !== userId) {
      return forbiddenResponse('この記事を編集する権限がありません')
    }

    // バリデーション
    const validationResult = updatePostSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const {
      title,
      content,
      excerpt,
      coverImage,
      categoryId,
      tagIds,
      published,
    } = validationResult.data

    // タイトルが変更された場合、新しいslugを生成
    let newSlug = existingPost.slug
    if (title && title !== existingPost.title) {
      newSlug = await generateUniqueSlug(
        title,
        async (generatedSlug) => {
          // 現在の記事以外で同じslugが存在しないか確認
          const existingPostWithSlug = await prisma.post.findFirst({
            where: {
              slug: generatedSlug,
              id: { not: existingPost.id },
            },
          })
          return !existingPostWithSlug
        },
        'post'
      )
    }

    // カテゴリの存在確認
    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return validationErrorResponse('指定されたカテゴリが存在しません')
      }
    }

    // タグの存在確認
    if (tagIds && tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: {
          id: {
            in: tagIds,
          },
        },
      })
      if (tags.length !== tagIds.length) {
        return validationErrorResponse('指定されたタグが存在しません')
      }
    }

    // 更新データの構築
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (newSlug !== existingPost.slug) updateData.slug = newSlug
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (published !== undefined) {
      updateData.published = published
      // 初めて公開する場合はpublishedAtを設定
      if (published && !existingPost.publishedAt) {
        updateData.publishedAt = new Date()
      }
      // 非公開にする場合はpublishedAtをクリア
      if (!published) {
        updateData.publishedAt = null
      }
    }

    // 既存のタグを削除してから新しいタグを追加
    if (tagIds !== undefined) {
      // 既存のPostTagを削除
      await prisma.postTag.deleteMany({
        where: {
          postId: existingPost.id,
        },
      })
      // 新しいタグを追加
      if (tagIds.length > 0) {
        updateData.tags = {
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        }
      }
    }

    // 記事の更新
    const post = await prisma.post.update({
      where: { id: existingPost.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // レスポンス用のデータ変換
    const formattedPost = {
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      published: post.published,
      updatedAt: post.updatedAt.toISOString(),
    }

    return successResponse({
      post: formattedPost,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    if (error instanceof ForbiddenError) {
      return forbiddenResponse(error.message)
    }
    return errorResponse(error, '記事の更新に失敗しました')
  }
}

/**
 * 記事削除
 * DELETE /api/posts/[slug]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const { slug } = await params

    // 記事の存在確認と所有権チェック
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    })

    if (!existingPost) {
      return notFoundResponse('記事')
    }

    // 所有権チェック（自分の記事のみ削除可能）
    if (Number(existingPost.authorId) !== userId) {
      return forbiddenResponse('この記事を削除する権限がありません')
    }

    // 記事の削除（関連するPostTagも自動的に削除される）
    await prisma.post.delete({
      where: { id: existingPost.id },
    })

    return successResponse({
      message: '記事を削除しました',
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    if (error instanceof ForbiddenError) {
      return forbiddenResponse(error.message)
    }
    return errorResponse(error, '記事の削除に失敗しました')
  }
}

