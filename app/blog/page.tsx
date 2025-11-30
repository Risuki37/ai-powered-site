import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PostList } from '@/components/blog/post-list'
import { BlogFilters } from '@/components/blog/blog-filters'

interface BlogPageProps {
  searchParams: Promise<{
    page?: string
    category?: string
    tag?: string
    search?: string
  }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">ブログ</h1>
            <p className="text-muted-foreground mt-2">
              最新の記事をお届けします
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <Suspense
                fallback={
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">読み込み中...</p>
                  </div>
                }
              >
                <PostList
                  page={page}
                  categoryId={params.category ? parseInt(params.category, 10) : undefined}
                  tagId={params.tag ? parseInt(params.tag, 10) : undefined}
                  search={params.search}
                />
              </Suspense>
            </div>

            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">読み込み中...</div>
              }
            >
              <BlogFilters
                currentCategoryId={params.category ? parseInt(params.category, 10) : undefined}
                currentTagId={params.tag ? parseInt(params.tag, 10) : undefined}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

