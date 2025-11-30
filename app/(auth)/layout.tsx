import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '認証',
  description: 'ログインまたは新規登録',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <main id="main-content" className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold" aria-label="ホームに戻る">
            AI構成サイト
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}

