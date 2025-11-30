/**
 * スラッグ生成ユーティリティ
 */

/**
 * 日本語文字を含むかどうかを検出
 * @param text - チェックするテキスト
 * @returns 日本語文字を含む場合true
 */
function containsJapanese(text: string): boolean {
  // ひらがな、カタカナ、漢字の範囲をチェック
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  return japaneseRegex.test(text)
}

/**
 * 生成されたslugが適切かどうかをチェック
 * @param slug - チェックするslug
 * @param originalText - 元のテキスト
 * @returns slugが適切でない場合true（フォールバックが必要）
 */
function shouldUseFallback(slug: string, originalText: string): boolean {
  // 空文字列の場合はフォールバックが必要
  if (!slug) {
    return true
  }

  // 日本語文字を含む場合はフォールバックを使用
  if (containsJapanese(originalText)) {
    return true
  }

  // 数字のみで短いslug（例：「1」「123」）の場合はフォールバックを使用
  // ただし、長い数字（例：「20241129」）は許可
  if (/^\d{1,3}$/.test(slug)) {
    return true
  }

  return false
}

/**
 * 文字列をスラッグに変換
 * @param text - 変換するテキスト
 * @returns スラッグ
 */
export function generateSlug(text: string): string {
  // 空文字列、null、undefinedのチェック
  if (!text || typeof text !== 'string') {
    return ''
  }

  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 特殊文字を削除
    .replace(/[\s_-]+/g, '-') // スペースやアンダースコアをハイフンに
    .replace(/^-+|-+$/g, '') // 先頭・末尾のハイフンを削除

  // 結果が空文字列の場合は空文字列を返す
  return slug
}

/**
 * 一意なスラッグを生成（重複チェック関数付き）
 * @param baseText - ベースとなるテキスト
 * @param checkUnique - スラッグが一意かどうかをチェックする関数
 * @param fallbackPrefix - フォールバック時のプレフィックス（デフォルト: "item"）
 * @returns 一意なスラッグ
 */
export async function generateUniqueSlug(
  baseText: string,
  checkUnique: (slug: string) => Promise<boolean>,
  fallbackPrefix: string = 'item'
): Promise<string> {
  // ベーステキストのチェック
  if (!baseText || typeof baseText !== 'string') {
    throw new Error('ベーステキストが無効です')
  }

  let slug = generateSlug(baseText)
  
  // スラッグが空文字列、または日本語を含む場合、または数字のみで短い場合は、
  // プレフィックス付きタイムスタンプベースのフォールバックを使用
  if (shouldUseFallback(slug, baseText)) {
    slug = `${fallbackPrefix}-${Date.now()}`
  }

  let counter = 1
  const baseSlug = slug

  // スラッグが既に使用されている場合、連番を追加
  while (!(await checkUnique(slug))) {
    slug = `${baseSlug}-${counter}`
    counter++
    
    // 無限ループ防止（最大1000回まで）
    if (counter > 1000) {
      throw new Error('一意なスラッグの生成に失敗しました')
    }
  }

  return slug
}

