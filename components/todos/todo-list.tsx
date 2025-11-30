'use client'

import { useEffect, useState } from 'react'
import { TodoCard } from './todo-card'
import { Button } from '@/components/ui/button'

export interface Todo {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  dueDate: string | null
  category: {
    id: string
    name: string
    color: string | null
  } | null
  project: {
    id: string
    name: string
    description: string | null
  } | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

interface TodoListProps {
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  categoryId?: number
  projectId?: number
}

async function fetchTodos(params?: TodoListProps) {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.set('status', params.status)
  if (params?.priority) queryParams.set('priority', params.priority)
  if (params?.categoryId) queryParams.set('categoryId', params.categoryId.toString())
  if (params?.projectId) queryParams.set('projectId', params.projectId.toString())

  const response = await fetch(
    `/api/todos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error('Todoの取得に失敗しました')
  }

  return response.json() as Promise<{
    todos: Todo[]
  }>
}

export function TodoList(props: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadTodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.status, props.priority, props.categoryId, props.projectId])

  const loadTodos = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchTodos(props)
      setTodos(data.todos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (id: string) => {
    // 編集ページに遷移
    window.location.href = `/todos/${id}/edit`
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このTodoを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Todoの削除に失敗しました')
      }

      // リストを再読み込み
      loadTodos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={loadTodos} variant="outline" className="mt-4">
          再読み込み
        </Button>
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Todoがありません</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}

