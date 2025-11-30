import Link from 'next/link'
import { PostCard } from './post-card'
import { prisma } from '@/lib/prisma'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  author: {
    id: string
    name: string
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  } | null
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  publishedAt: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface PostListProps {
  page: number
  categoryId?: number
  tagId?: number
  search?: string
}

async function fetchPosts(
  page: number,
  categoryId?: number,
  tagId?: number,
  search?: string
) {
  const limit = 10
  const skip = (page - 1) * limit

  // クエリ条件の構築（公開済み記事のみ）
  const where: {
    published: boolean
    publishedAt: { not: null }
    categoryId?: bigint
    tags?: { some: { tagId: bigint } }
    OR?: Array<{ title: { contains: string } } | { content: { contains: string } } | { excerpt: { contains: string } }>
  } = {
    published: true,
    publishedAt: {
      not: null,
    },
  }

  if (categoryId) {
    where.categoryId = BigInt(categoryId)
  }

  if (tagId) {
    where.tags = {
      some: {
        tagId: BigInt(tagId),
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
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ])

  // レスポンス用のデータ変換
  const formattedPosts: Post[] = posts.map((post) => ({
    id: post.id.toString(),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    author: {
      id: post.author.id.toString(),
      name: post.author.name || '',
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
    publishedAt: post.publishedAt?.toISOString() || null,
    createdAt: post.createdAt.toISOString(),
  }))

  const totalPages = Math.ceil(total / limit)

  return {
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

export async function PostList({
  page,
  categoryId,
  tagId,
  search,
}: PostListProps) {
  let posts: Post[] = []
  let pagination: Pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  }

  try {
    const result = await fetchPosts(page, categoryId, tagId, search)
    posts = result.posts
    pagination = result.pagination
  } catch (error) {
    console.error('記事取得エラー:', error)
    // エラーが発生した場合は空のリストを表示
  }

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId.toString())
    if (tagId) params.set('tag', tagId.toString())
    if (search) params.set('search', search)
    if (newPage > 1) params.set('page', newPage.toString())
    return `/blog${params.toString() ? `?${params.toString()}` : ''}`
  }

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">記事が見つかりませんでした</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          {pagination.page > 1 && (
            <Link
              href={buildPageUrl(pagination.page - 1)}
              className="px-4 py-2 border rounded-md hover:bg-accent"
            >
              前へ
            </Link>
          )}

          <div className="flex gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={buildPageUrl(pageNum)}
                  className={`px-4 py-2 border rounded-md ${
                    pageNum === pagination.page
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            )}
          </div>

          {pagination.page < pagination.totalPages && (
            <Link
              href={buildPageUrl(pagination.page + 1)}
              className="px-4 py-2 border rounded-md hover:bg-accent"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

