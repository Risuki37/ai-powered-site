import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostActions } from '@/components/blog/post-actions'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

// 動的メタデータ生成
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchPost(slug)

  if (!data || !data.post) {
    return {
      title: '記事が見つかりません',
    }
  }

  const { post } = data

  return {
    title: post.title,
    description: post.excerpt || 'ブログ記事',
    openGraph: {
      title: post.title,
      description: post.excerpt || 'ブログ記事',
      type: 'article',
      images: post.coverImage ? [post.coverImage] : [],
      publishedTime: post.publishedAt || undefined,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || 'ブログ記事',
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

async function fetchPost(slug: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/posts/${slug}`,
    {
      next: { revalidate: 60 }, // 60秒間キャッシュ
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('記事の取得に失敗しました')
  }

  return response.json() as Promise<{
    post: {
      id: string
      title: string
      slug: string
      content: string
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
      updatedAt: string
    }
  }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const data = await fetchPost(slug)

  if (!data || !data.post) {
    notFound()
  }

  const { post } = data
  const session = await auth()
  const isAuthor = session?.user && post.author.id === session.user.id

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 戻るボタンとアクション */}
          <div className="flex justify-between items-center mb-6">
            <Link href="/blog">
              <Button variant="ghost">
                ← ブログ一覧に戻る
              </Button>
            </Link>
            {isAuthor && <PostActions slug={slug} title={post.title} />}
          </div>

          <article>
            {/* ヘッダー */}
            <header className="mb-8">
              {post.category && (
                <div className="mb-4">
                  <Link
                    href={`/blog?category=${post.category.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {post.category.name}
                  </Link>
                </div>
              )}

              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              {/* メタ情報 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  {post.author.image && (
                    <Image
                      src={post.author.image}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span>{post.author.name}</span>
                </div>
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                )}
              </div>

              {post.coverImage && (
                <div className="relative w-full h-96 overflow-hidden rounded-lg mb-8">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  />
                </div>
              )}
            </header>

            {/* 本文 */}
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* タグ */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-lg font-semibold mb-4">タグ</h2>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog?tag=${tag.id}`}
                      className="px-3 py-1 bg-secondary rounded-md text-sm hover:bg-secondary/80"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}

