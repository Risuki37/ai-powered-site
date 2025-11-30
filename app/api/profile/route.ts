import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth-helpers'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import { ConflictError, UnauthorizedError } from '@/lib/errors'

/**
 * プロフィール情報取得
 * GET /api/profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return errorResponse(
        new Error('ユーザーが見つかりません'),
        'ユーザーが見つかりません',
        404
      )
    }

    return successResponse({
      user: {
        ...user,
        id: user.id.toString(),
      },
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'プロフィール情報の取得に失敗しました')
  }
}

/**
 * プロフィール情報更新
 * PUT /api/profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const body = await request.json()

    // バリデーション
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const { name, email, image, bio } = validationResult.data

    // メールアドレスが変更される場合、重複チェック
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      })

      if (existingUser) {
        throw new ConflictError('このメールアドレスは既に使用されています')
      }
    }

    // プロフィール更新
    const updateData: {
      name?: string
      email?: string
      image?: string | null
      bio?: string | null
    } = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (image !== undefined) updateData.image = image
    if (bio !== undefined) updateData.bio = bio

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        updatedAt: true,
      },
    })

    return successResponse({
      user: {
        ...user,
        id: user.id.toString(),
      },
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    if (error instanceof ConflictError) {
      return errorResponse(error, error.message, 409)
    }
    return errorResponse(error, 'プロフィール情報の更新に失敗しました')
  }
}

