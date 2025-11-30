'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * ページ遷移時にメインコンテンツにフォーカスを移動するフック
 */
export function useFocusManagement() {
  const pathname = usePathname()
  const mainContentRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // メインコンテンツ要素を取得
    mainContentRef.current = document.getElementById('main-content')

    // ページ遷移時にメインコンテンツにフォーカスを移動
    if (mainContentRef.current) {
      // 少し遅延を入れて、DOMの更新を待つ
      setTimeout(() => {
        mainContentRef.current?.focus()
        // スクロール位置を調整（必要に応じて）
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [pathname])

  return mainContentRef
}

/**
 * エラー発生時にエラーメッセージにフォーカスを移動するフック
 */
export function useErrorFocus(error: unknown, enabled: boolean = true) {
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (enabled && error && errorRef.current) {
      // エラーが発生したらエラーメッセージにフォーカスを移動
      setTimeout(() => {
        errorRef.current?.focus()
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [error, enabled])

  return errorRef
}

