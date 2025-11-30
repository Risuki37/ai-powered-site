import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">ダッシュボード</h1>
            <p className="text-muted-foreground mt-2">
              ようこそ、{session.user.name || session.user.email}さん
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 統計カード */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">ブログ記事</h2>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground mt-2">公開済み記事数</p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Todo</h2>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground mt-2">未完了のタスク</p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">完了率</h2>
              <p className="text-3xl font-bold">0%</p>
              <p className="text-sm text-muted-foreground mt-2">タスク完了率</p>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">クイックアクション</h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link href="/blog/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">新しい記事を作成</Button>
              </Link>
              <Link href="/todos/new" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">新しいTodoを作成</Button>
              </Link>
              <Link href="/profile" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">プロフィールを編集</Button>
              </Link>
            </div>
          </div>

          {/* 管理機能 */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">管理機能</h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link href="/admin/categories" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">カテゴリ管理</Button>
              </Link>
              <Link href="/admin/tags" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">タグ管理</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

