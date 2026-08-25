'use client'

import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

/**
 * 로그아웃 + 우측 끝 권한 배지.
 * 인증은 4단계(Supabase Auth)에서 붙인다.
 * 연결 시 onClick 을 supabase.auth.signOut() + 로그인 화면 이동으로 바꾼다.
 */
export const LogoutButton = () => (
  <button
    type="button"
    onClick={() => toast.info('로그아웃은 인증 연결(4단계) 후 동작합니다')}
    className="text-sidebar-muted hover:bg-muted hover:text-sidebar-foreground flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
  >
    <LogOut className="size-4 shrink-0" aria-hidden />
    로그아웃
    <span className="bg-sidebar-accent text-sidebar-accent-foreground ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide">
      admin
    </span>
  </button>
)
