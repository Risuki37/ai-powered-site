export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-6 px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 AI構成サイト. All rights reserved.
          </p>
          <nav className="flex gap-6" aria-label="フッターナビゲーション">
            <a
              href="/about"
              className="text-sm text-muted-foreground hover:text-primary"
              aria-label="このサイトについて"
            >
              このサイトについて
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary"
              aria-label="プライバシーポリシー"
            >
              プライバシーポリシー
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

