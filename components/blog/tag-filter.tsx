'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Tag {
  id: string
  name: string
  slug: string
  postCount: number
}

interface TagFilterProps {
  tags: Tag[]
  currentTagId?: number
  currentCategoryId?: number
}

export function TagFilter({
  tags,
  currentTagId,
  currentCategoryId,
}: TagFilterProps) {
  const buildUrl = (tagId?: number) => {
    const params = new URLSearchParams()
    if (currentCategoryId) {
      params.set('category', currentCategoryId.toString())
    }
    if (tagId) {
      params.set('tag', tagId.toString())
    }
    return `/blog${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>タグ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildUrl()}
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1 text-sm transition-colors hover:bg-accent',
              !currentTagId && 'bg-accent font-medium'
            )}
          >
            すべて
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={buildUrl(parseInt(tag.id, 10))}
              className={cn(
                'inline-flex items-center rounded-md px-3 py-1 text-sm transition-colors hover:bg-accent',
                currentTagId === parseInt(tag.id, 10) && 'bg-accent font-medium'
              )}
            >
              {tag.name}
              <Badge variant="secondary" className="ml-2">
                {tag.postCount}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

