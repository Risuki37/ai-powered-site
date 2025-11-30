'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AuthButton } from '@/components/auth/auth-button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold" aria-label="ホームに戻る">
            AI構成サイト
          </Link>
          <nav className="hidden md:flex items-center gap-6" aria-label="メインナビゲーション">
            <Link
              href="/blog"
              className="text-sm font-medium transition-colors hover:text-primary"
              aria-label="ブログ一覧ページへ"
            >
              ブログ
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <AuthButton />
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>メニュー</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4" aria-label="モバイルメインナビゲーション">
                <Link
                  href="/blog"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                  aria-label="ブログ一覧ページへ"
                >
                  ブログ
                </Link>
                <div className="border-t pt-4">
                  <AuthButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

