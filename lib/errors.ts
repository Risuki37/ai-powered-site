// エラーハンドリング用ユーティリティ

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}が見つかりません`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '権限がありません') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * エラーログを出力
 */
function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const errorInfo: any = {
    timestamp,
    ...(context && { context }),
  }

  if (error instanceof AppError) {
    errorInfo.type = error.name
    errorInfo.code = error.code || 'ERROR'
    errorInfo.message = error.message
    errorInfo.statusCode = error.statusCode
    if (error.stack) {
      errorInfo.stack = error.stack
    }
  } else if (error instanceof Error) {
    errorInfo.type = 'Error'
    errorInfo.message = error.message
    if (error.stack) {
      errorInfo.stack = error.stack
    }
  } else {
    errorInfo.type = 'Unknown'
    errorInfo.error = error
  }

  // 開発環境では詳細なログを出力
  if (process.env.NODE_ENV === 'development') {
    console.error('Error log:', JSON.stringify(errorInfo, null, 2))
  } else {
    // 本番環境では簡潔なログを出力
    console.error(`[${timestamp}] ${errorInfo.type}: ${errorInfo.message}`, {
      code: errorInfo.code,
      statusCode: errorInfo.statusCode,
      context: errorInfo.context,
    })
  }
}

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'エラーが発生しました',
  context?: string
) {
  // エラーログを出力
  logError(error, context)

  if (error instanceof AppError) {
    return {
      error: {
        code: error.code || 'ERROR',
        message: error.message,
        ...(error instanceof ValidationError && error.details
          ? { details: error.details }
          : {}),
      },
    }
  }

  // 予期しないエラー
  return {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: defaultMessage,
    },
  }
}

