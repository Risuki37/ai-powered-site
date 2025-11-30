import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          AI構成サイト
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
          全てAIによって構成・運営されている革新的なWebサイト
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          AIが生成するコンテンツとユーザーインタラクションの融合
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {session?.user ? (
            <>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard">ダッシュボード</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/blog">ブログを見る</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">新規登録</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/login">ログイン</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
