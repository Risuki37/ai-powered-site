'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTagSchema, updateTagSchema, type CreateTagInput, type UpdateTagInput } from '@/lib/validations'
import { extractErrorInfo } from '@/lib/error-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Tag {
  id: string
  name: string
  slug: string
  postCount: number
}

export default function TagsManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<unknown>(null)

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
  } = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<UpdateTagInput>({
    resolver: zodResolver(updateTagSchema),
  })

  // セッション確認
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // タグ一覧取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTags()
    }
  }, [status])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }
      const data = await response.json()
      setTags(data.tags || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Tags fetch error:', error)
      setError(error)
      setIsLoading(false)
    }
  }

  const onCreateSubmit = async (data: CreateTagInput) => {
    setIsCreateLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tags', {
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
      await fetchTags()
      setIsCreateDialogOpen(false)
      resetCreate()
    } catch (error) {
      console.error('Tag creation error:', error)
      setError(error)
    } finally {
      setIsCreateLoading(false)
    }
  }

  const onEditSubmit = async (data: UpdateTagInput) => {
    if (!editingTag) return

    setIsEditLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
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
      await fetchTags()
      setIsEditDialogOpen(false)
      setEditingTag(null)
      resetEdit()
    } catch (error) {
      console.error('Tag update error:', error)
      setError(error)
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setEditValue('name', tag.name)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingTag) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/tags/${deletingTag.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }

      // 削除成功後、一覧を再取得
      await fetchTags()
      setIsDeleteDialogOpen(false)
      setDeletingTag(null)
      setDeleteError(null)
    } catch (error) {
      console.error('Tag delete error:', error)
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
              <h1 className="text-3xl font-bold">タグ管理</h1>
              <p className="text-muted-foreground mt-2">
                ブログタグを管理できます
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
              新しいタグを作成
            </Button>
          </div>

          {error != null && <ErrorMessage error={error} className="mb-6" />}

          <Card>
            <CardHeader>
              <CardTitle>タグ一覧</CardTitle>
              <CardDescription>すべてのタグを表示します</CardDescription>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  タグがまだありません
                </p>
              ) : (
                <div className="space-y-4">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tag.name}</h3>
                          <Badge variant="secondary">{tag.postCount}記事</Badge>
                        </div>
                        <code className="text-sm bg-muted px-2 py-1 rounded block w-fit">
                          {tag.slug}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                          aria-label={`${tag.name}を編集`}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingTag(tag)
                            setIsDeleteDialogOpen(true)
                          }}
                          aria-label={`${tag.name}を削除`}
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
            <DialogTitle>新しいタグを作成</DialogTitle>
            <DialogDescription>
              ブログタグの情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4" aria-label="タグ作成フォーム">
            <div className="space-y-2">
              <Label htmlFor="create-name">タグ名 *</Label>
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
            <DialogTitle>タグを編集</DialogTitle>
            <DialogDescription>
              タグの情報を更新してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4" aria-label="タグ編集フォーム">
            <div className="space-y-2">
              <Label htmlFor="edit-name">タグ名 *</Label>
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

            {error != null && <ErrorMessage error={error} autoFocus />}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingTag(null)
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
            <DialogTitle>タグを削除しますか？</DialogTitle>
            <DialogDescription>
              {deletingTag && (
                <>
                  この操作は取り消せません。タグ「{deletingTag.name}」が完全に削除されます。
                  {deletingTag.postCount > 0 && (
                    <span className="block mt-2 text-muted-foreground">
                      このタグは{deletingTag.postCount}件の記事で使用されています。削除すると、これらの記事からタグが解除されます。
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteError && <ErrorMessage error={deleteError} className="mb-4" />}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingTag(null)
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

