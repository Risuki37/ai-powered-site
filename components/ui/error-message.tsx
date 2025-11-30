'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractErrorMessage, formatValidationErrors } from '@/lib/error-messages'

export interface ErrorMessageProps {
  error: unknown
  className?: string
  showHint?: boolean
  autoFocus?: boolean
}

/**
 * 統一されたエラーメッセージ表示コンポーネント
 */
export function ErrorMessage({
  error,
  className,
  showHint = true,
  autoFocus = false,
}: ErrorMessageProps) {
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // エラーが発生し、autoFocusがtrueの場合、エラーメッセージにフォーカスを移動
    if (autoFocus && error && errorRef.current) {
      // 少し遅延を入れて、DOMの更新を待つ
      setTimeout(() => {
        errorRef.current?.focus()
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [error, autoFocus])

  if (!error) {
    return null
  }

  const { message, hint, details } = extractErrorMessage(error)
  const validationErrors = details ? formatValidationErrors(details) : []

  return (
    <div
      ref={errorRef}
      className={cn(
        'rounded-md bg-destructive/10 p-4 border border-destructive/20',
        autoFocus && 'focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2',
        className
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={autoFocus ? -1 : undefined}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">{message}</p>
          {showHint && hint && (
            <p className="text-sm text-muted-foreground mt-1">{hint}</p>
          )}
          {validationErrors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {validationErrors.map((errorMsg, index) => (
                <li
                  key={index}
                  className="text-sm text-destructive/80 list-disc list-inside"
                >
                  {errorMsg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export interface InlineErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string
  className?: string
  id?: string
}

export function InlineErrorMessage({
  message,
  className,
  id,
  ...props
}: InlineErrorMessageProps) {
  if (!message) return null

  return (
    <p
      className={cn('text-sm text-destructive', className)}
      id={id}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {message}
    </p>
  )
}
