import { NextResponse } from 'next/server'
import { createErrorResponse } from './errors'

/**
 * 成功レスポンスを生成
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * エラーレスポンスを生成
 */
export function errorResponse(
  error: unknown,
  defaultMessage: string = 'エラーが発生しました',
  defaultStatus: number = 500,
  context?: string
): NextResponse {
  const errorData = createErrorResponse(error, defaultMessage, context)
  const status =
    error instanceof Error && 'statusCode' in error
      ? (error as { statusCode: number }).statusCode
      : defaultStatus

  return NextResponse.json(errorData, { status })
}

/**
 * バリデーションエラーレスポンスを生成
 */
export function validationErrorResponse(
  message: string,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message,
        ...(details && { details }),
      },
    },
    { status: 400 }
  )
}

/**
 * 認証エラーレスポンスを生成
 */
export function unauthorizedResponse(
  message: string = '認証が必要です'
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status: 401 }
  )
}

/**
 * 権限エラーレスポンスを生成
 */
export function forbiddenResponse(
  message: string = '権限がありません'
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 }
  )
}

/**
 * リソース未存在エラーレスポンスを生成
 */
export function notFoundResponse(resource: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `${resource}が見つかりません`,
      },
    },
    { status: 404 }
  )
}

/**
 * 競合エラーレスポンスを生成
 */
export function conflictResponse(message: string = 'リソースが競合しています'): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'CONFLICT',
        message,
      },
    },
    { status: 409 }
  )
}

