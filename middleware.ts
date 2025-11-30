import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { isTestEnvironment } from '@/lib/test-helpers'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // セキュリティヘッダーの設定
  const response = NextResponse.next()

  // セキュリティヘッダー
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  )

  // HTTPS環境では追加のセキュリティヘッダー
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  // 保護されたルートの認証チェック
  const protectedPaths = ['/dashboard', '/profile', '/settings', '/blog/new', '/todos']
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    try {
      // テスト環境でテスト用のヘッダーが存在する場合、認証チェックをスキップ
      if (isTestEnvironment()) {
        const testUserId = request.headers.get('x-test-user-id')
        if (testUserId) {
          // テスト用のヘッダーをリクエストに追加して、APIルートハンドラで使用できるようにする
          response.headers.set('x-test-user-id', testUserId)
          return response
        }
      }

      const session = await auth()

      if (!session?.user) {
        // 未認証の場合はログインページにリダイレクト
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      // エラー時もログインページにリダイレクト
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 認証済みユーザーがログインページや登録ページにアクセスした場合、ダッシュボードにリダイレクト
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  if (isAuthPath) {
    try {
      // テスト環境でテスト用のヘッダーが存在する場合、認証チェックをスキップ
      if (isTestEnvironment()) {
        const testUserId = request.headers.get('x-test-user-id')
        if (testUserId) {
          // テスト用のヘッダーをリクエストに追加
          response.headers.set('x-test-user-id', testUserId)
          // テスト環境ではログインページへのリダイレクトをスキップ
          return response
        }
      }

      const session = await auth()

      if (session?.user) {
        // 認証済みの場合はダッシュボードにリダイレクト
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Middleware auth check error:', error)
      // エラー時はそのまま続行（ログインページを表示）
    }
  }

  // テスト環境でテスト用のヘッダーが存在する場合、それをリクエストに追加
  if (isTestEnvironment()) {
    const testUserId = request.headers.get('x-test-user-id')
    if (testUserId) {
      response.headers.set('x-test-user-id', testUserId)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 以下のパスのみでミドルウェアを実行:
     * - api routes (除く /api/auth/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
