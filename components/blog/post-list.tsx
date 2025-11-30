import Link from 'next/link'
import { PostCard } from './post-card'

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
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('limit', '10')
  if (categoryId) params.set('category', categoryId.toString())
  if (tagId) params.set('tag', tagId.toString())
  if (search) params.set('search', search)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/posts?${params.toString()}`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error('記事の取得に失敗しました')
  }

  return response.json() as Promise<{
    posts: Post[]
    pagination: Pagination
  }>
}

export async function PostList({
  page,
  categoryId,
  tagId,
  search,
}: PostListProps) {
  const { posts, pagination } = await fetchPosts(page, categoryId, tagId, search)

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

