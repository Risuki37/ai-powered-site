'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateTodoSchema, type UpdateTodoInput } from '@/lib/validations'
import { extractErrorInfo } from '@/lib/error-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

export default function EditTodoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const todoId = params?.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateTodoInput>({
    resolver: zodResolver(updateTodoSchema),
  })

  const statusValue = watch('status')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && todoId) {
      fetchTodo()
    }
  }, [status, todoId])

  const fetchTodo = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/todos/${todoId}`)
      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }
      const data = await response.json()
      const todo = data.todo

      // フォームに値を設定
      setValue('title', todo.title)
      if (todo.description) setValue('description', todo.description)
      setValue('status', todo.status)
      setValue('priority', todo.priority)
      if (todo.dueDate) {
        // ISO形式からdatetime-local形式に変換
        const date = new Date(todo.dueDate)
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setValue('dueDate', localDateTime)
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Todo fetch error:', err)
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました')
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: UpdateTodoInput) => {
    setIsUpdating(true)
    setError(null)

    try {
      // dueDateをISO形式に変換
      const updateData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      }

      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        setError({ error: errorInfo })
        setIsUpdating(false)
        return
      }

      // 更新成功後、Todo一覧ページにリダイレクト
      router.push('/todos')
    } catch (error) {
      console.error('Todo update error:', error)
      setError('Todoの更新に失敗しました')
      setIsUpdating(false)
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
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Todoを編集</h1>
            <p className="text-muted-foreground mt-2">
              タスクを編集できます
            </p>
          </div>

          {error && <ErrorMessage error={error} className="mb-6" />}

          <Card>
            <CardHeader>
              <CardTitle>Todo情報</CardTitle>
              <CardDescription>タスクの詳細を編集してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Todoタイトル"
                    {...register('title')}
                    disabled={isUpdating}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">詳細説明</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="タスクの詳細を入力してください"
                    {...register('description')}
                    disabled={isUpdating}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">ステータス</Label>
                  <select
                    id="status"
                    {...register('status')}
                    disabled={isUpdating}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="TODO">未着手</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="DONE">完了</option>
                  </select>
                  {errors.status && (
                    <p className="text-sm text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">優先度</Label>
                  <select
                    id="priority"
                    {...register('priority')}
                    disabled={isUpdating}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="HIGH">高</option>
                    <option value="MEDIUM">中</option>
                    <option value="LOW">低</option>
                  </select>
                  {errors.priority && (
                    <p className="text-sm text-destructive">
                      {errors.priority.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">期限</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    {...register('dueDate', {
                      setValueAs: (value) => {
                        if (!value) return null
                        // datetime-localのフォーマットをISO形式に変換
                        return new Date(value).toISOString()
                      },
                    })}
                    disabled={isUpdating}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">
                      {errors.dueDate.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? '更新中...' : 'Todoを更新'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isUpdating}
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

