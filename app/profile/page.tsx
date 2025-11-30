'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from '@/lib/validations'
import { extractErrorInfo } from '@/lib/error-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorMessage, InlineErrorMessage } from '@/components/ui/error-message'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface ProfileData {
  id: string
  email: string
  name: string
  image: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<unknown>(null)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState<string>('')
  const [passwordSuccess, setPasswordSuccess] = useState<string>('')

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  // セッション確認
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // プロフィール情報取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }
      const data = await response.json()
      setProfileData(data.user)
      resetProfile({
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
        bio: data.user.bio,
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Profile fetch error:', error)
      setError(error)
      setIsLoading(false)
    }
  }

  const onProfileSubmit = async (data: UpdateProfileInput) => {
    setIsUpdating(true)
    setError(null)
    setSuccess('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }

      const result = await response.json()

      setProfileData(result.user)
      setSuccess('プロフィールを更新しました')
      
      // セッションを更新するためにページをリロード
      window.location.reload()
    } catch (error) {
      console.error('Profile update error:', error)
      setError(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess('')

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorInfo = await extractErrorInfo(response)
        throw { error: errorInfo }
      }

      await response.json()

      setPasswordSuccess('パスワードを変更しました')
      resetPassword()
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordError(error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>読み込み中...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session?.user || !profileData) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">プロフィール</h1>

          {error != null && <ErrorMessage error={error} className="mb-6" />}

          {success && (
            <div className="mb-6 rounded-md bg-green-500/10 p-4">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* プロフィール編集フォーム */}
            <Card>
              <CardHeader>
                <CardTitle>プロフィール情報</CardTitle>
                <CardDescription>プロフィール情報を編集できます</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitProfile(onProfileSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      type="text"
                      {...registerProfile('name')}
                      disabled={isUpdating}
                    />
                    {profileErrors.name && (
                      <p className="text-sm text-destructive">
                        {profileErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerProfile('email')}
                      disabled={isUpdating}
                    />
                    {profileErrors.email && (
                      <p className="text-sm text-destructive">
                        {profileErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">アバター画像URL</Label>
                    <Input
                      id="image"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      {...registerProfile('image')}
                      disabled={isUpdating}
                    />
                    {profileErrors.image && (
                      <p className="text-sm text-destructive">
                        {profileErrors.image.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">自己紹介</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      placeholder="自己紹介を入力してください"
                      {...registerProfile('bio')}
                      disabled={isUpdating}
                    />
                    {profileErrors.bio && (
                      <p className="text-sm text-destructive">
                        {profileErrors.bio.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? '更新中...' : 'プロフィールを更新'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* パスワード変更フォーム */}
            <Card>
              <CardHeader>
                <CardTitle>パスワード変更</CardTitle>
                <CardDescription>パスワードを変更できます</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitPassword(onPasswordSubmit)}
                  className="space-y-4"
                  aria-label="パスワード変更フォーム"
                >
                  {passwordError != null && (
                    <ErrorMessage error={passwordError} className="mb-4" />
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 rounded-md bg-green-500/10 p-4 border border-green-500/20">
                      <p className="text-sm text-green-600">{passwordSuccess}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">現在のパスワード</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...registerPassword('currentPassword')}
                      disabled={isChangingPassword}
                      aria-invalid={passwordErrors.currentPassword ? 'true' : 'false'}
                      aria-describedby={passwordErrors.currentPassword ? 'current-password-error' : undefined}
                      autoComplete="current-password"
                    />
                    {passwordErrors.currentPassword && (
                      <InlineErrorMessage
                        id="current-password-error"
                        message={passwordErrors.currentPassword.message}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新しいパスワード</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...registerPassword('newPassword')}
                      disabled={isChangingPassword}
                      aria-invalid={passwordErrors.newPassword ? 'true' : 'false'}
                      aria-describedby={passwordErrors.newPassword ? 'new-password-error' : undefined}
                      autoComplete="new-password"
                    />
                    {passwordErrors.newPassword && (
                      <InlineErrorMessage
                        id="new-password-error"
                        message={passwordErrors.newPassword.message}
                      />
                    )}
                  </div>

                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? '変更中...' : 'パスワードを変更'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

