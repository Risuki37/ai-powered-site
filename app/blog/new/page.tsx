'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema, type CreatePostInput } from '@/lib/validations'
import { extractErrorInfo } from '@/lib/error-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ErrorMessage } from '@/components/ui/error-message'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface Tag {
  id: string
  name: string
  slug: string
}

export default function NewPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      published: false,
    },
  })

  const selectedCategoryId = watch('categoryId')
  const selectedTagIds = watch('tagIds') || []
  const publishedValue = watch('published')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/blog/new')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // カテゴリとタグを並列取得
      const [categoriesResponse, tagsResponse] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
      ])

      if (!categoriesResponse.ok || !tagsResponse.ok) {
        const errorInfo = await extractErrorInfo(
          categoriesResponse.ok ? tagsResponse : categoriesResponse
        )
        setError({ error: errorInfo })
        setIsLoading(false)
        return
      }

      const categoriesData = await categoriesResponse.json()
      const tagsData = await tagsResponse.json()

      // カテゴリとタグを設定
      setCategories(categoriesData.categories || [])
      setTags(tagsData.tags || [])

      setIsLoading(false)
    } catch (err) {
      console.error('Data fetch error:', err)
      setError(err)
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CreatePostInput) => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        setError({ error: errorInfo })
        setIsCreating(false)
        return
      }

      const result = await response.json()

      // 作成成功後、記事詳細ページにリダイレクト
      router.push(`/blog/${result.post.slug}`)
    } catch (error) {
      console.error('Post creation error:', error)
      setError(error)
      setIsCreating(false)
    }
  }

  const handleTagToggle = (tagId: number) => {
    const currentIds = selectedTagIds || []
    if (currentIds.includes(tagId)) {
      setValue(
        'tagIds',
        currentIds.filter((id) => id !== tagId)
      )
    } else {
      setValue('tagIds', [...currentIds, tagId])
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>読み込み中...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">新しい記事を作成</h1>
            <p className="text-muted-foreground mt-2">
              新しいブログ記事を作成します
            </p>
          </div>

          {error != null && <ErrorMessage error={error} className="mb-6" />}

          <Card>
            <CardHeader>
              <CardTitle>記事情報</CardTitle>
              <CardDescription>記事の内容を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="記事のタイトルを入力"
                    {...register('title')}
                    disabled={isCreating}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">本文 *</Label>
                  <Textarea
                    id="content"
                    rows={15}
                    placeholder="記事の本文を入力"
                    {...register('content')}
                    disabled={isCreating}
                    className="font-mono"
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive">
                      {errors.content.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">抜粋</Label>
                  <Textarea
                    id="excerpt"
                    rows={3}
                    placeholder="記事の抜粋を入力（500文字以内）"
                    {...register('excerpt')}
                    disabled={isCreating}
                  />
                  {errors.excerpt && (
                    <p className="text-sm text-destructive">
                      {errors.excerpt.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverImage">カバー画像URL</Label>
                  <Input
                    id="coverImage"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    {...register('coverImage')}
                    disabled={isCreating}
                  />
                  {errors.coverImage && (
                    <p className="text-sm text-destructive">
                      {errors.coverImage.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">カテゴリ</Label>
                  <Select
                    value={selectedCategoryId?.toString() || 'none'}
                    onValueChange={(value) =>
                      setValue('categoryId', value === 'none' ? null : parseInt(value, 10))
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">カテゴリなし</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>タグ</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md">
                    {tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-full">
                        タグがありません
                      </p>
                    ) : (
                      tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTagIds.includes(parseInt(tag.id, 10))}
                            onCheckedChange={() =>
                              handleTagToggle(parseInt(tag.id, 10))
                            }
                            disabled={isCreating}
                          />
                          <Label
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {tag.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  {errors.tagIds && (
                    <p className="text-sm text-destructive">
                      {errors.tagIds.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="published"
                      checked={publishedValue || false}
                      onCheckedChange={(checked) =>
                        setValue('published', checked === true)
                      }
                      disabled={isCreating}
                    />
                    <Label htmlFor="published" className="cursor-pointer">
                      公開する
                    </Label>
                  </div>
                  {errors.published && (
                    <p className="text-sm text-destructive">
                      {errors.published.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? '作成中...' : '記事を作成'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/blog')}
                    disabled={isCreating}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

