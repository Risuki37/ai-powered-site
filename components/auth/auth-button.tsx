'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function AuthButton() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  // ハイドレーションエラーを防ぐために、マウント前は何も表示しない
  if (!mounted || status === 'loading') {
    return (
      <Button variant="ghost" disabled>
        読み込み中...
      </Button>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <Link href="/login">ログイン</Link>
        </Button>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/register">新規登録</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {session.user.name || session.user.email}
      </span>
      <Button variant="ghost" onClick={handleSignOut} className="w-full sm:w-auto">
        ログアウト
      </Button>
    </div>
  )
}

