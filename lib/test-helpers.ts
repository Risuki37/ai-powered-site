/**
 * テスト用ヘルパー関数
 * 
 * このファイルはテスト環境でのみ使用されます。
 * 本番環境では使用しないでください。
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * テスト用: ユーザーを作成してセッション情報を取得
 * 
 * @param email メールアドレス
 * @param password パスワード
 * @param name ユーザー名
 * @returns セッション情報
 */
export async function createTestUser(
  email: string,
  password: string,
  name: string
): Promise<{
  id: number
  email: string
  name: string | null
}> {
  // 既存ユーザーを削除（テスト用）
  await prisma.user.deleteMany({
    where: { email },
  })

  // パスワードのハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10)

  // ユーザー作成
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'USER',
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  return user
}

/**
 * テスト用: 認証済みのリクエストを作成
 * 
 * この関数は、テスト用にモックされたセッション情報を持つリクエストを生成します。
 * 実際のNextAuth.jsのセッション管理をバイパスします。
 * 
 * @param userId ユーザーID
 * @param options 追加オプション
 * @returns モックされたリクエストオブジェクト
 */
export function createAuthenticatedRequest(
  userId: number,
  options: {
    method?: string
    url?: string
    body?: Record<string, unknown>
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
  } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Content-Type', 'application/json')

  // テスト用のセッション情報をヘッダーに含める
  // 実際の実装では、ミドルウェアでこのヘッダーを検出してセッションをモック
  requestHeaders.set('x-test-user-id', userId.toString())

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(url, requestInit)
}

/**
 * テスト用: 認証ヘルパー（モックセッション用）
 * 
 * テスト環境でのみ使用される認証ヘルパー関数です。
 * 実際のNextAuth.jsのセッションをバイパスして、テスト用のセッションを返します。
 * 
 * @param userId ユーザーID
 * @returns モックされたセッション情報
 */
export async function getTestSession(userId: number): Promise<{
  userId: number
  email: string
  role: string
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    return null
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
}

/**
 * テスト用: APIリクエストをテスト用の認証ヘッダー付きで実行
 * 
 * @param url リクエストURL
 * @param options リクエストオプション
 * @param userId ユーザーID（認証が必要な場合）
 * @returns fetch レスポンス
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  userId?: number
): Promise<Response> {
  const headers = new Headers(options.headers)

  if (userId) {
    // テスト用の認証ヘッダーを追加
    headers.set('x-test-user-id', userId.toString())
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * テスト用: テストユーザーをクリーンアップ
 * 
 * @param email 削除するユーザーのメールアドレス
 */
export async function cleanupTestUser(email: string): Promise<void> {
  await prisma.user.deleteMany({
    where: { email },
  })
}

/**
 * テスト環境かどうかを判定
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true'
}

