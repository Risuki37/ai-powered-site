'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCategorySchema, updateCategorySchema, type CreateCategoryInput, type UpdateCategoryInput } from '@/lib/validations'
import { extractErrorInfo } from '@/lib/error-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorMessage, InlineErrorMessage } from '@/components/ui/error-message'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  postCount: number
}

export default function CategoriesManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<unknown>(null)

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
  })

  // セッション確認
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // カテゴリ一覧取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories()
    }
  }, [status])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }
      const data = await response.json()
      setCategories(data.categories || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Categories fetch error:', error)
      setError(error)
      setIsLoading(false)
    }
  }

  const onCreateSubmit = async (data: CreateCategoryInput) => {
    setIsCreateLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }

      // 作成成功後、一覧を再取得
      await fetchCategories()
      setIsCreateDialogOpen(false)
      resetCreate()
    } catch (error) {
      console.error('Category creation error:', error)
      setError(error)
    } finally {
      setIsCreateLoading(false)
    }
  }

  const onEditSubmit = async (data: UpdateCategoryInput) => {
    if (!editingCategory) return

    setIsEditLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }

      // 更新成功後、一覧を再取得
      await fetchCategories()
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      resetEdit()
    } catch (error) {
      console.error('Category update error:', error)
      setError(error)
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setEditValue('name', category.name)
    setEditValue('description', category.description || '')
    setIsEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }

      // 削除成功後、一覧を再取得
      await fetchCategories()
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
      setDeleteError(null)
    } catch (error) {
      console.error('Category delete error:', error)
      setDeleteError(error)
    } finally {
      setIsDeleting(false)
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">カテゴリ管理</h1>
              <p className="text-muted-foreground mt-2">
                ブログカテゴリを管理できます
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
              新しいカテゴリを作成
            </Button>
          </div>

          {error != null && <ErrorMessage error={error} className="mb-6" />}

          <Card>
            <CardHeader>
              <CardTitle>カテゴリ一覧</CardTitle>
              <CardDescription>すべてのカテゴリを表示します</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  カテゴリがまだありません
                </p>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant="secondary">{category.postCount}記事</Badge>
                        </div>
                        <code className="text-sm bg-muted px-2 py-1 rounded block w-fit">
                          {category.slug}
                        </code>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          aria-label={`${category.name}を編集`}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingCategory(category)
                            setIsDeleteDialogOpen(true)
                          }}
                          aria-label={`${category.name}を削除`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* 作成ダイアログ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいカテゴリを作成</DialogTitle>
            <DialogDescription>
              ブログカテゴリの情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">カテゴリ名 *</Label>
              <Input
                id="create-name"
                {...registerCreate('name')}
                disabled={isCreateLoading}
                aria-invalid={createErrors.name ? 'true' : 'false'}
                aria-describedby={createErrors.name ? 'create-name-error' : undefined}
              />
              {createErrors.name && (
                <InlineErrorMessage
                  id="create-name-error"
                  message={createErrors.name.message}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">説明</Label>
              <Textarea
                id="create-description"
                rows={3}
                {...registerCreate('description')}
                disabled={isCreateLoading}
                aria-invalid={createErrors.description ? 'true' : 'false'}
                aria-describedby={createErrors.description ? 'create-description-error' : undefined}
              />
              {createErrors.description && (
                <InlineErrorMessage
                  id="create-description-error"
                  message={createErrors.description.message}
                />
              )}
            </div>

            {error != null && <ErrorMessage error={error} autoFocus />}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetCreate()
                }}
                disabled={isCreateLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isCreateLoading}>
                {isCreateLoading ? '作成中...' : '作成'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリを編集</DialogTitle>
            <DialogDescription>
              カテゴリの情報を更新してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4" aria-label="カテゴリ編集フォーム">
            <div className="space-y-2">
              <Label htmlFor="edit-name">カテゴリ名 *</Label>
              <Input
                id="edit-name"
                {...registerEdit('name')}
                disabled={isEditLoading}
                aria-invalid={editErrors.name ? 'true' : 'false'}
                aria-describedby={editErrors.name ? 'edit-name-error' : undefined}
              />
              {editErrors.name && (
                <InlineErrorMessage
                  id="edit-name-error"
                  message={editErrors.name.message}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">説明</Label>
              <Textarea
                id="edit-description"
                rows={3}
                {...registerEdit('description')}
                disabled={isEditLoading}
                aria-invalid={editErrors.description ? 'true' : 'false'}
                aria-describedby={editErrors.description ? 'edit-description-error' : undefined}
              />
              {editErrors.description && (
                <InlineErrorMessage
                  id="edit-description-error"
                  message={editErrors.description.message}
                />
              )}
            </div>

            {error != null && <ErrorMessage error={error} autoFocus />}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingCategory(null)
                  resetEdit()
                }}
                disabled={isEditLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isEditLoading}>
                {isEditLoading ? '更新中...' : '更新'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリを削除しますか？</DialogTitle>
            <DialogDescription>
              {deletingCategory && (
                <>
                  この操作は取り消せません。カテゴリ「{deletingCategory.name}」が完全に削除されます。
                  {deletingCategory.postCount > 0 && (
                    <span className="block mt-2 text-destructive font-medium">
                      注意: このカテゴリには{deletingCategory.postCount}件の記事が関連付けられています。
                      記事が関連付けられているカテゴリは削除できません。
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteError != null && <ErrorMessage error={deleteError} className="mb-4" />}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingCategory(null)
                setDeleteError(null)
              }}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '削除中...' : '削除する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

