'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { credentialsSchema } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * 운영자 로그인 폼. 인증은 4단계(Supabase Auth)에서 붙인다.
 *
 * 연결 시 submit 을 supabase.auth.signInWithPassword 로 바꾸고,
 * 성공 후 profiles.role === 'admin' 확인 → 아니면 즉시 로그아웃 + 접근 거부.
 * 역할 검사는 반드시 서버에서 한다(클라 검사만으로는 우회 가능).
 */
export const LoginForm = () => {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

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
    startTransition(() => {
      toast.info('로그인은 인증 연결(4단계) 후 동작합니다')
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
        {pending ? '확인 중…' : '로그인'}
      </Button>

      <p className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-relaxed">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        운영자 전용입니다. 일반 유저 계정으로는 접근할 수 없습니다
        <br />
        (로그인 성공 후 역할이 admin 인지 서버에서 재확인합니다)
      </p>
    </form>
  )
}
