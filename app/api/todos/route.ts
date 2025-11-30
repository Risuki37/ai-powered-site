import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTodoSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-helpers'
import { UnauthorizedError } from '@/lib/errors'

/**
 * Todo一覧取得
 * GET /api/todos
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const { searchParams } = new URL(request.url)

    // クエリパラメータの取得
    const status = searchParams.get('status') as 'TODO' | 'IN_PROGRESS' | 'DONE' | null
    const priority = searchParams.get('priority') as 'HIGH' | 'MEDIUM' | 'LOW' | null
    const categoryId = searchParams.get('categoryId')
      ? parseInt(searchParams.get('categoryId')!, 10)
      : undefined
    const projectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined

    // クエリ条件の構築（自分のTodoのみ）
    const where: any = {
      userId,
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (projectId) {
      where.projectId = projectId
    }

    // Todo一覧の取得
    const todos = await prisma.todo.findMany({
      where,
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
      orderBy: [
        { priority: 'desc' }, // 優先度の高い順
        { dueDate: 'asc' }, // 期日の早い順
        { createdAt: 'desc' }, // 作成日の新しい順
      ],
    })

    // レスポンス用のデータ変換
    const formattedTodos = todos.map((todo) => ({
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
    }))

    return successResponse({
      todos: formattedTodos,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'Todo一覧の取得に失敗しました')
  }
}

/**
 * Todo作成
 * POST /api/todos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const body = await request.json()

    // バリデーション
    const validationResult = createTodoSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(
        '入力内容に誤りがあります',
        validationResult.error.flatten().fieldErrors
      )
    }

    const { title, description, priority, dueDate, categoryId, projectId } =
      validationResult.data

    // カテゴリの存在確認
    if (categoryId) {
      const category = await prisma.todoCategory.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return validationErrorResponse('指定されたカテゴリが存在しません')
      }
    }

    // プロジェクトの存在確認（自分のプロジェクトのみ）
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId, // 自分のプロジェクトのみ
        },
      })
      if (!project) {
        return validationErrorResponse('指定されたプロジェクトが存在しません')
      }
    }

    // Todoの作成
    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
        categoryId: categoryId || null,
        projectId: projectId || null,
        status: 'TODO',
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
      createdAt: todo.createdAt.toISOString(),
    }

    return successResponse(
      {
        todo: formattedTodo,
      },
      201
    )
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse(error.message)
    }
    return errorResponse(error, 'Todoの作成に失敗しました')
  }
}

