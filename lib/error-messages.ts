/**
 * エラーメッセージの統一化とユーザーフレンドリーな変換
 */

export interface ApiError {
  code?: string
  message: string
  details?: Record<string, unknown>
}

/**
 * エラーコードからユーザーフレンドリーなメッセージとヒントを取得
 */
export function getUserFriendlyErrorMessage(
  errorCode: string,
  defaultMessage?: string
): { message: string; hint?: string } {
  const errorMessages: Record<
    string,
    { message: string; hint?: string }
  > = {
    VALIDATION_ERROR: {
      message: '入力内容に誤りがあります',
      hint: '入力内容をご確認の上、再度お試しください',
    },
    UNAUTHORIZED: {
      message: 'ログインが必要です',
      hint: 'この操作を行うにはログインしてください',
    },
    FORBIDDEN: {
      message: 'この操作を行う権限がありません',
      hint: 'このリソースにアクセスする権限がありません',
    },
    NOT_FOUND: {
      message: 'リソースが見つかりません',
      hint: '指定されたリソースは存在しないか、削除された可能性があります',
    },
    CONFLICT: {
      message: 'リソースの競合が発生しました',
      hint: '既に同じ内容のリソースが存在する可能性があります',
    },
    INTERNAL_SERVER_ERROR: {
      message: 'サーバーエラーが発生しました',
      hint: 'しばらく時間をおいてから再度お試しください。問題が続く場合はお問い合わせください',
    },
  }

  const errorInfo = errorMessages[errorCode]
  if (errorInfo) {
    return errorInfo
  }

  // デフォルトメッセージが提供されている場合はそれを使用
  return {
    message: defaultMessage || 'エラーが発生しました',
    hint: 'しばらく時間をおいてから再度お試しください',
  }
}

/**
 * APIレスポンスからエラーメッセージを抽出
 */
export function extractErrorMessage(error: unknown): {
  message: string
  hint?: string
  details?: Record<string, unknown>
} {
  // APIレスポンス形式のエラー
  if (
    error &&
    typeof error === 'object' &&
    'error' in error
  ) {
    const apiError = (error as { error: ApiError }).error
    const code = apiError.code || 'UNKNOWN_ERROR'
    const { message, hint } = getUserFriendlyErrorMessage(
      code,
      apiError.message
    )

    return {
      message,
      hint,
      details: apiError.details,
    }
  }

  // Errorオブジェクト
  if (error instanceof Error) {
    return {
      message: error.message,
      hint: 'しばらく時間をおいてから再度お試しください',
    }
  }

  // 文字列
  if (typeof error === 'string') {
    return {
      message: error,
      hint: 'しばらく時間をおいてから再度お試しください',
    }
  }

  // その他
  return {
    message: '予期しないエラーが発生しました',
    hint: 'しばらく時間をおいてから再度お試しください。問題が続く場合はお問い合わせください',
  }
}

/**
 * バリデーションエラーの詳細メッセージを整形
 */
export function formatValidationErrors(
  details?: Record<string, unknown>
): string[] {
  if (!details) {
    return []
  }

  return Object.entries(details)
    .map(([field, messages]) => {
      if (Array.isArray(messages)) {
        return messages
          .map((msg) => (typeof msg === 'string' ? msg : String(msg)))
          .join(', ')
      }
      return typeof messages === 'string'
        ? messages
        : `${field}: ${String(messages)}`
    })
    .filter(Boolean)
}

/**
 * APIレスポンスからエラー情報を抽出（詳細情報含む）
 */
export function extractErrorInfo(response: Response): Promise<ApiError> {
  return response
    .json()
    .then((data) => {
      if (data.error) {
        return data.error as ApiError
      }
      throw new Error('Invalid error response format')
    })
    .catch(() => {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'エラーが発生しました',
      }
    })
}

