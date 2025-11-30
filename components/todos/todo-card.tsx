'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Todo } from './todo-list'

interface TodoCardProps {
  todo: Todo
  onUpdate?: (id: string) => void
  onDelete?: (id: string) => void
}

const statusLabels = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  DONE: '完了',
}

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
}

const priorityLabels = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

const priorityColors = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800',
}

export function TodoCard({ todo, onUpdate, onDelete }: TodoCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const dueDate = formatDate(todo.dueDate)
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== 'DONE'

  return (
    <Card className={`h-full ${todo.status === 'DONE' ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 line-clamp-2">{todo.title}</CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className={statusColors[todo.status]}>
              {statusLabels[todo.status]}
            </Badge>
            <Badge className={priorityColors[todo.priority]}>
              {priorityLabels[todo.priority]}
            </Badge>
          </div>
        </div>
        {todo.description && (
          <CardDescription className="line-clamp-3">
            {todo.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {todo.category && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">カテゴリ:</span>
              <span
                className="text-xs px-2 py-1 rounded-md text-white"
                style={{
                  backgroundColor: todo.category.color || '#6b7280',
                }}
              >
                {todo.category.name}
              </span>
            </div>
          )}
          {todo.project && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">プロジェクト:</span>
              <span className="text-xs">{todo.project.name}</span>
            </div>
          )}
          {dueDate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">期限:</span>
              <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                {dueDate}
                {isOverdue && ' (期限切れ)'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {todo.completedAt ? (
            <span>完了日: {formatDate(todo.completedAt)}</span>
          ) : (
            <span>作成日: {formatDate(todo.createdAt)}</span>
          )}
        </div>
        <div className="flex gap-2">
          {onUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate(todo.id)}
            >
              編集
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(todo.id)}
            >
              削除
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

