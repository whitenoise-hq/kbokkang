'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { credentialsSchema } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { signIn } from '../actions'

/** 운영자 로그인 폼. 실제 인증과 역할 검사는 서버 액션에서 수행한다. */
export const LoginForm = () => {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)

  const redirectTo = params.get('redirect') ?? '/'

  // 미들웨어가 권한 없는 접근을 돌려보낸 경우
  useEffect(() => {
    if (params.get('error') === 'forbidden') {
      setFormError('운영자 권한이 없는 계정입니다. 다른 계정으로 로그인하세요')
    }
  }, [params])

  const submit = () => {
    const parsed = credentialsSchema.safeParse({ email, password })

    if (!parsed.success) {
      const next: { email?: string; password?: string } = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (field === 'email' && next.email === undefined) next.email = issue.message
        if (field === 'password' && next.password === undefined) next.password = issue.message
      })
      setErrors(next)
      return
    }

    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await signIn({ email, password })

      if (!result.ok) {
        setFormError(result.message)
        setPassword('')
        return
      }

      toast.success(result.message)
      router.replace(redirectTo)
      router.refresh()
    })
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {formError !== null && (
        <p className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {formError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          className={cn(errors.email !== undefined && 'border-destructive')}
          aria-invalid={errors.email !== undefined}
          disabled={pending}
        />
        {errors.email !== undefined && <p className="text-destructive text-xs">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={cn('pr-10', errors.password !== undefined && 'border-destructive')}
            aria-invalid={errors.password !== undefined}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password !== undefined && (
          <p className="text-destructive text-xs">{errors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? '로그인 중…' : '로그인'}
      </Button>

      <p className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-relaxed">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        운영자 전용입니다. 로그인 후 서버에서 권한을 재확인하며, 운영자가 아니면 즉시 로그아웃됩니다
      </p>
    </form>
  )
}
