import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// DATABASE_URL環境変数の確認
if (!process.env.DATABASE_URL) {
  const errorMessage =
    process.env.NODE_ENV === 'production'
      ? 'DATABASE_URL environment variable is not set. Please configure it in Vercel dashboard.'
      : 'DATABASE_URL environment variable is not set. Please check your .env.local file.'
  
  console.error(`[Prisma] ${errorMessage}`)
  
  // 本番環境ではエラーをスローしない（ビルド時にエラーになる可能性があるため）
  // 代わりに、Prismaクライアントの初期化時にエラーが発生することを期待
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

