import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 初期データの投入を開始します...')

  // デフォルトカテゴリの作成
  const defaultCategory = await prisma.category.upsert({
    where: { slug: 'uncategorized' },
    update: {},
    create: {
      name: '未分類',
      slug: 'uncategorized',
      description: 'カテゴリが指定されていない記事',
    },
  })

  console.log('✅ デフォルトカテゴリを作成しました:', defaultCategory.name)

  // デフォルトTodoカテゴリの作成
  const defaultTodoCategory = await prisma.todoCategory.upsert({
    where: { name: 'デフォルト' },
    update: {},
    create: {
      name: 'デフォルト',
      color: '#3b82f6',
    },
  })

  console.log('✅ デフォルトTodoカテゴリを作成しました:', defaultTodoCategory.name)

  console.log('✨ 初期データの投入が完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

