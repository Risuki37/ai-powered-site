/**
 * データベース接続テストスクリプト
 * 
 * このスクリプトは、Supabaseデータベースへの接続をテストします。
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('データベース接続をテストしています...')
    
    // 1. 基本的な接続テスト
    await prisma.$connect()
    console.log('✅ データベース接続成功')
    
    // 2. テーブルの存在確認
    const tables = [
      'users',
      'posts',
      'categories',
      'tags',
      'todos',
      'accounts',
      'sessions',
    ]
    
    console.log('\nテーブルの存在確認:')
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          table
        )
        const exists = (result as Array<{ exists: boolean }>)[0]?.exists
        console.log(`  ${exists ? '✅' : '❌'} ${table}: ${exists ? '存在' : '不存在'}`)
      } catch (error) {
        console.log(`  ❌ ${table}: エラー - ${error}`)
      }
    }
    
    // 3. データの確認
    console.log('\nデータの確認:')
    try {
      const userCount = await prisma.user.count()
      console.log(`  users: ${userCount}件`)
    } catch (error) {
      console.log(`  users: エラー - ${error}`)
    }
    
    try {
      const postCount = await prisma.post.count()
      console.log(`  posts: ${postCount}件`)
    } catch (error) {
      console.log(`  posts: エラー - ${error}`)
    }
    
    try {
      const categoryCount = await prisma.category.count()
      console.log(`  categories: ${categoryCount}件`)
    } catch (error) {
      console.log(`  categories: エラー - ${error}`)
    }
    
    try {
      const tagCount = await prisma.tag.count()
      console.log(`  tags: ${tagCount}件`)
    } catch (error) {
      console.log(`  tags: エラー - ${error}`)
    }
    
    console.log('\n✅ すべてのテストが完了しました')
    
  } catch (error) {
    console.error('❌ データベース接続エラー:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

