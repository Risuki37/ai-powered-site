'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TodoList } from '@/components/todos/todo-list'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TodosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | undefined>()
  const [filterPriority, setFilterPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW' | undefined>()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Todo</h1>
              <p className="text-muted-foreground mt-2">
                タスクを管理しましょう
              </p>
            </div>
            <Button onClick={() => router.push('/todos/new')} className="w-full sm:w-auto">
              新しいTodoを作成
            </Button>
          </div>

          {/* フィルター */}
          <div className="mb-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium mb-2">ステータスでフィルター</h2>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filterStatus === undefined ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterStatus(undefined)}
                >
                  すべて
                </Badge>
                <Badge
                  variant={filterStatus === 'TODO' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterStatus('TODO')}
                >
                  未着手
                </Badge>
                <Badge
                  variant={filterStatus === 'IN_PROGRESS' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterStatus('IN_PROGRESS')}
                >
                  進行中
                </Badge>
                <Badge
                  variant={filterStatus === 'DONE' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterStatus('DONE')}
                >
                  完了
                </Badge>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium mb-2">優先度でフィルター</h2>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filterPriority === undefined ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterPriority(undefined)}
                >
                  すべて
                </Badge>
                <Badge
                  variant={filterPriority === 'HIGH' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterPriority('HIGH')}
                >
                  高
                </Badge>
                <Badge
                  variant={filterPriority === 'MEDIUM' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterPriority('MEDIUM')}
                >
                  中
                </Badge>
                <Badge
                  variant={filterPriority === 'LOW' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterPriority('LOW')}
                >
                  低
                </Badge>
              </div>
            </div>
          </div>

          {/* Todoリスト */}
          <TodoList
            status={filterStatus}
            priority={filterPriority}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

