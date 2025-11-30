import { Suspense } from 'react'
import { CategoryFilter } from './category-filter'
import { TagFilter } from './tag-filter'
import { prisma } from '@/lib/prisma'

interface BlogFiltersProps {
  currentCategoryId?: number
  currentTagId?: number
}

async function fetchCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true,
                publishedAt: {
                  not: null,
                },
              },
            },
          },
        },
      },
    })

    return {
      categories: categories.map((category) => ({
        id: category.id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        postCount: category._count.posts,
      })),
    }
  } catch (error) {
    console.error('カテゴリ取得エラー:', error)
    return { categories: [] }
  }
}

async function fetchTags() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        posts: {
          where: {
            post: {
              published: true,
              publishedAt: {
                not: null,
              },
            },
          },
        },
      },
    })

    return {
      tags: tags.map((tag) => ({
        id: tag.id.toString(),
        name: tag.name,
        slug: tag.slug,
        postCount: tag.posts.length,
      })),
    }
  } catch (error) {
    console.error('タグ取得エラー:', error)
    return { tags: [] }
  }
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

