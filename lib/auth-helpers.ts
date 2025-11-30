// 認証ヘルパー関数

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { UnauthorizedError } from './errors'
import { isTestEnvironment, getTestSession } from './test-helpers'
import { prisma } from './prisma'

/**
 * リクエストからセッション情報を取得
 * テスト環境では、リクエストヘッダーからテスト用のセッション情報を取得します
 */
export async function getSession(request?: NextRequest): Promise<{
  userId: number
  email: string
  role: string
} | null> {
  // テスト環境でリクエストが提供されている場合、テスト用のヘッダーをチェック
  if (isTestEnvironment() && request) {
    const testUserId = request.headers.get('x-test-user-id')
    
    if (testUserId) {
      const userId = parseInt(testUserId, 10)
      if (!isNaN(userId)) {
        const testSession = await getTestSession(userId)
        if (testSession) {
          return testSession
        }
      }
    }
  }

  // 通常のNextAuth.jsセッションを取得
  const session = await auth()
  if (!session?.user) {
    return null
  }

  return {
    userId: Number(session.user.id),
    email: session.user.email!,
    role: (session.user as any).role || 'USER',
  }
}

/**
 * 認証が必要なリクエストのセッションを取得
 * 認証されていない場合はエラーをthrow
 * 
 * @param request リクエストオブジェクト（テスト環境で必要）
 */
export async function requireAuth(request?: NextRequest): Promise<{
  userId: number
  email: string
  role: string
}> {
  const session = await getSession(request)

  if (!session) {
    throw new UnauthorizedError('ログインが必要です')
  }

  return session
}

/**
 * 管理者権限をチェック
 * 
 * @param request リクエストオブジェクト（テスト環境で必要）
 */
export async function requireAdmin(request?: NextRequest): Promise<{
  userId: number
  email: string
  role: string
}> {
  const session = await requireAuth(request)

  if (session.role !== 'ADMIN') {
    throw new UnauthorizedError('管理者権限が必要です')
  }

  return session
}

