import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from './_components/login-form'

export const metadata: Metadata = {
  title: '로그인 · 크보깡 어드민',
}

/**
 * 운영자 로그인 — 어드민 기획서 3.1.
 * 이 화면은 (dashboard) 그룹 밖이라 사이드바 셸이 적용되지 않는다.
 */
const LoginPage = () => (
  <main className="flex min-h-svh items-center justify-center px-6 py-12">
    <div className="w-full max-w-[360px] space-y-6">
      <div className="space-y-1.5 text-center">
        <p className="text-2xl font-bold tracking-tight">크보깡</p>
        <p className="text-muted-foreground text-sm">어드민</p>
      </div>

      <Card>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-[11px]">
        KBO 경기 승부예측 · 카드 수집 서비스 운영 도구
      </p>
    </div>
  </main>
)

export default LoginPage
