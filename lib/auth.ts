import { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validations'

/**
 * NextAuth.js v5設定
 */
export const authOptions: NextAuthConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email/Password認証
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください')
        }

        // バリデーション
        const validatedFields = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        })

        if (!validatedFields.success) {
          throw new Error('入力内容に誤りがあります')
        }

        const { email, password } = validatedFields.data

        // ユーザー検索
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        // パスワード検証
        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || null,
          image: user.image || null,
          role: user.role,
        }
      },
    }),
    // Google OAuth（環境変数が設定されている場合のみ）
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // GitHub OAuth（環境変数が設定されている場合のみ）
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
  // NextAuth.js v5では、AUTH_SECRETまたはNEXTAUTH_SECRET環境変数が必要
  // ビルド時には環境変数が設定されていない場合でもビルドを続行できるようにする
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (() => {
      // ビルド時（Vercelのビルドプロセス）では、環境変数が設定されていない場合がある
      // その場合でもビルドを続行できるように、一時的な値を返す
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.VERCEL === '1' // Vercelのビルドプロセスを検出
      ) {
        // ビルド時には一時的な値を返し、実行時に環境変数が設定されていることを期待する
        return 'build-time-temporary-secret-change-in-production'
      }
      throw new Error(
        'NEXTAUTH_SECRET or AUTH_SECRET environment variable is required'
      )
    })(),
}

// NextAuth.js v5のauth関数をエクスポート
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

