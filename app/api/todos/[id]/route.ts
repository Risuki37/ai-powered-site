import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTodoSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-helpers'
import { UnauthorizedError } from '@/lib/errors'

/**
 * Todo詳細取得
 * GET /api/todos/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const { id } = await params
    const todoId = parseInt(id, 10)

    if (isNaN(todoId)) {
      return validationErrorResponse('Todo IDが不正です')
    }

    // Todoの取得（自分のTodoのみ）
    const todo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (!todo) {
      return notFoundResponse('Todo')
    }

    // レスポンス用のデータ変換
    const formattedTodo = {
      id: todo.id.toString(),
      title: todo.title,
      description: todo.description,
      status: todo.status,
      priority: todo.priority,
      dueDate: todo.dueDate?.toISOString() || null,
      category: todo.category
        ? {
            id: todo.category.id.toString(),
            name: todo.category.name,
            color: todo.category.color,
          }
        : null,
      project: todo.project
        ? {
            id: todo.project.id.toString(),
            name: todo.project.name,
            description: todo.project.description,
          }
        : null,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
      completedAt: todo.completedAt?.toISOString() || null,
    }

    return successResponse({
      todo: formattedTodo,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'Todo詳細の取得に失敗しました')
  }
}

/**
 * Todo更新
 * PUT /api/todos/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const { id } = await params
    const todoId = parseInt(id, 10)

    if (isNaN(todoId)) {
      return validationErrorResponse('Todo IDが不正です')
    }

    const body = await request.json()

    // バリデーション
    const validationResult = updateTodoSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    // 自分のTodoか確認
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
    })

    if (!existingTodo) {
      return notFoundResponse('Todo')
    }

    const { title, description, status, priority, dueDate, categoryId, projectId } =
      validationResult.data

    // カテゴリの存在確認
    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.todoCategory.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return validationErrorResponse('指定されたカテゴリが存在しません')
      }
    }

    // プロジェクトの存在確認（自分のプロジェクトのみ）
    if (projectId !== undefined && projectId !== null) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      })
      if (!project) {
        return validationErrorResponse('指定されたプロジェクトが存在しません')
      }
    }

    // 更新データの構築
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (projectId !== undefined) updateData.projectId = projectId || null

    // ステータスがDONEになった場合、completedAtを設定
    if (status === 'DONE' && existingTodo.status !== 'DONE') {
      updateData.completedAt = new Date()
    }
    // ステータスがDONE以外になった場合、completedAtをクリア
    if (status !== undefined && status !== 'DONE' && existingTodo.status === 'DONE') {
      updateData.completedAt = null
    }

    // Todoの更新
    const todo = await prisma.todo.update({
      where: { id: todoId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // レスポンス用のデータ変換
    const formattedTodo = {
      id: todo.id.toString(),
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
      updatedAt: todo.updatedAt.toISOString(),
    }

    return successResponse({
      todo: formattedTodo,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'Todoの更新に失敗しました')
  }
}

/**
 * Todo削除
 * DELETE /api/todos/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const { id } = await params
    const todoId = parseInt(id, 10)

    if (isNaN(todoId)) {
      return validationErrorResponse('Todo IDが不正です')
    }

    // 自分のTodoか確認
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
    })

    if (!existingTodo) {
      return notFoundResponse('Todo')
    }

    // Todoの削除
    await prisma.todo.delete({
      where: { id: todoId },
    })

    return successResponse({
      message: 'Todoを削除しました',
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'Todoの削除に失敗しました')
  }
}

