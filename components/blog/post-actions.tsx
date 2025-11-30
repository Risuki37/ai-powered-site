'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PostActionsProps {
  slug: string
  title: string
}

export function PostActions({ slug, title }: PostActionsProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>('')

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || '記事の削除に失敗しました')
        setIsDeleting(false)
        return
      }

      // 削除成功後、ブログ一覧ページにリダイレクト
      router.push('/blog')
    } catch (error) {
      console.error('Post delete error:', error)
      setError('記事の削除に失敗しました')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/blog/${slug}/edit`)}
        >
          編集
        </Button>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          削除
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>記事を削除しますか？</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。記事「{title}」が完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
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
    </>
  )
}

