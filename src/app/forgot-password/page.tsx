'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/icons/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // 这里将实现与后端的忘记密码交互
      // 暂时模拟发送重置邮件
      console.log('忘记密码请求:', { email })
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟发送成功
      setSuccess('重置密码邮件已发送，请检查您的邮箱')
      setEmail('')
    } catch (err) {
      setError('发送重置邮件失败，请稍后重试')
      console.error('忘记密码错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            忘记密码
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            输入您的邮箱，我们将发送重置密码的链接
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">重置密码</CardTitle>
            <CardDescription>
              输入您的邮箱地址，我们将向您发送重置密码的链接
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-success/10 text-success rounded-md text-sm">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? '发送中...' : '发送重置链接'}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  想起密码了？{' '}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    立即登录
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
