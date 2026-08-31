'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { signOut } from '@/app/login/actions'

/** 로그아웃 + 우측 끝 권한 배지 */
export const LogoutButton = () => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await signOut()

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      // 미들웨어가 세션 없는 접근을 /login 으로 보내지만, 즉시 이동시켜 깜빡임을 줄인다
      router.replace('/login')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sidebar-muted hover:bg-muted hover:text-sidebar-foreground flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      {pending ? '로그아웃 중…' : '로그아웃'}
      <span className="bg-sidebar-accent text-sidebar-accent-foreground ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide">
        admin
      </span>
    </button>
  )
}
