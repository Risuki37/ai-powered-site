import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { changePasswordSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth-helpers'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import bcrypt from 'bcryptjs'

// このルートは認証情報（headers）を使用するため、動的にレンダリングする必要がある
export const dynamic = 'force-dynamic'

/**
 * パスワード変更
 * PUT /api/profile/password
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const body = await request.json()

    // バリデーション
    const validationResult = changePasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const { currentPassword, newPassword } = validationResult.data

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user || !user.password) {
      throw new UnauthorizedError('ユーザーが見つかりません')
    }

    // 現在のパスワード検証
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedError('現在のパスワードが正しくありません')
    }

    // 新しいパスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // パスワード更新
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    })

    return successResponse({
      message: 'パスワードを変更しました',
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'パスワードの変更に失敗しました')
  }
}

