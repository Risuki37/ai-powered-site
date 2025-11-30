import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        {post.coverImage && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardHeader>
          {post.category && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground">
                {post.category.name}
              </span>
            </div>
          )}
          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
          {post.excerpt && (
            <CardDescription className="line-clamp-3">
              {post.excerpt}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 bg-secondary rounded-md"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {post.author.image && (
              <Image
                src={post.author.image}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
                loading="lazy"
              />
            )}
            <span>{post.author.name}</span>
          </div>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}

