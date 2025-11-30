import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { ConflictError } from '@/lib/errors'
import bcrypt from 'bcryptjs'

/**
 * ユーザー登録API
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // バリデーション
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const { email, password, name } = validationResult.data

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictError('このメールアドレスは既に登録されています')
    }

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
        role: true,
        createdAt: true,
      },
    })

    return successResponse(
      {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      201
    )
  } catch (error) {
    return errorResponse(error, 'ユーザー登録に失敗しました')
  }
}

