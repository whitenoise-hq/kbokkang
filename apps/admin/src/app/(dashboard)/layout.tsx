import type { ReactNode } from 'react'
import { Sidebar } from '@/components/nav/sidebar'
import { MobileNav } from '@/components/nav/mobile-nav'

/**
 * 어드민 셸 — 전체화면 너비. 사이드바(배경색 있는 sticky 컬럼) + 본문.
 * 로그인 화면은 이 그룹 밖에 있어 셸이 적용되지 않는다.
 */
const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-svh">
    <Sidebar />

    <div className="min-w-0 flex-1">
      <header className="bg-card/80 sticky top-0 z-10 flex h-16 items-center gap-2 border-b px-4 backdrop-blur lg:hidden">
        <MobileNav />
        <span className="text-base font-bold tracking-tight">크보깡</span>
      </header>

      <main className="w-full space-y-6 px-6 py-10 lg:px-8">{children}</main>
    </div>
  </div>
)

export default DashboardLayout
