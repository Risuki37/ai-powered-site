import { Suspense } from 'react'
import { CategoryFilter } from './category-filter'
import { TagFilter } from './tag-filter'

interface BlogFiltersProps {
  currentCategoryId?: number
  currentTagId?: number
}

async function fetchCategories() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/categories`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    return { categories: [] }
  }

  const data = await response.json()
  return data
}

async function fetchTags() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tags`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    return { tags: [] }
  }

  const data = await response.json()
  return data
}

export async function BlogFilters({
  currentCategoryId,
  currentTagId,
}: BlogFiltersProps) {
  const [categoriesData, tagsData] = await Promise.all([
    fetchCategories(),
    fetchTags(),
  ])

  return (
    <aside className="space-y-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">読み込み中...</div>}>
        <CategoryFilter
          categories={categoriesData.categories || []}
          currentCategoryId={currentCategoryId}
          currentTagId={currentTagId}
        />
      </Suspense>
      <Suspense fallback={<div className="text-sm text-muted-foreground">読み込み中...</div>}>
        <TagFilter
          tags={tagsData.tags || []}
          currentTagId={currentTagId}
          currentCategoryId={currentCategoryId}
        />
      </Suspense>
    </aside>
  )
}

