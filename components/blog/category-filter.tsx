'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  postCount: number
}

interface CategoryFilterProps {
  categories: Category[]
  currentCategoryId?: number
  currentTagId?: number
}

export function CategoryFilter({
  categories,
  currentCategoryId,
  currentTagId,
}: CategoryFilterProps) {
  const buildUrl = (categoryId?: number) => {
    const params = new URLSearchParams()
    if (categoryId) {
      params.set('category', categoryId.toString())
    }
    if (currentTagId) {
      params.set('tag', currentTagId.toString())
    }
    return `/blog${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ</CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-2">
          <Link
            href={buildUrl()}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
              !currentCategoryId && 'bg-accent font-medium'
            )}
          >
            すべて
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={buildUrl(parseInt(category.id, 10))}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                currentCategoryId === parseInt(category.id, 10) &&
                  'bg-accent font-medium'
              )}
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-2">
                {category.postCount}
              </Badge>
            </Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}

