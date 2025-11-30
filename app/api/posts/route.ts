import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  paginationSchema,
  createPostSchema,
} from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import { generateUniqueSlug } from '@/lib/slug'
import { requireAuth } from '@/lib/auth-helpers'
import { UnauthorizedError } from '@/lib/errors'

/**
 * 記事一覧取得
 * GET /api/posts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // クエリパラメータの取得とバリデーション
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const categoryId = searchParams.get('category')
      ? BigInt(parseInt(searchParams.get('category')!, 10))
      : undefined
    const tagId = searchParams.get('tag')
      ? BigInt(parseInt(searchParams.get('tag')!, 10))
      : undefined
    const search = searchParams.get('search') || undefined

    // ページネーションのバリデーション
    const paginationResult = paginationSchema.safeParse({ page, limit })
    if (!paginationResult.success) {
      return validationErrorResponse(
        'ページネーションパラメータが不正です',
        paginationResult.error.flatten().fieldErrors
      )
    }

    const { page: validPage, limit: validLimit } = paginationResult.data

    // クエリ条件の構築（公開済み記事のみ）
    const where: Record<string, unknown> = {
      published: true,
      publishedAt: {
        not: null,
      },
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId,
        },
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { excerpt: { contains: search } },
      ]
    }

    // 記事一覧の取得
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
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
        orderBy: {
          publishedAt: 'desc',
        },
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      prisma.post.count({ where }),
    ])

    // レスポンス用のデータ変換
    const formattedPosts = posts.map((post) => ({
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
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
    }))

    const totalPages = Math.ceil(total / validLimit)

    return successResponse({
      posts: formattedPosts,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    return errorResponse(error, '記事一覧の取得に失敗しました')
  }
}

/**
 * 記事作成
 * POST /api/posts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const body = await request.json()

    // バリデーション
    const validationResult = createPostSchema.safeParse(body)
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

    // スラッグの生成（一意性を保証）
    const slug = await generateUniqueSlug(
      title,
      async (slug) => {
        const existingPost = await prisma.post.findUnique({
          where: { slug },
        })
        return !existingPost
      },
      'post-'
    )

    // カテゴリの存在確認
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(categoryId) },
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
            in: tagIds.map((id) => BigInt(id)),
          },
        },
      })
      if (tags.length !== tagIds.length) {
        return validationErrorResponse('指定されたタグが存在しません')
      }
    }

    // 記事の作成
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        published,
        publishedAt: published ? new Date() : null,
        authorId: BigInt(userId),
        categoryId: categoryId ? BigInt(categoryId) : null,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tagId: BigInt(tagId),
              })),
            }
          : undefined,
      },
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
      createdAt: post.createdAt.toISOString(),
    }

    return successResponse(
      {
        post: formattedPost,
      },
      201
    )
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, '記事の作成に失敗しました')
  }
}
