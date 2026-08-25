import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/nav/sidebar'
import { MobileNav } from '@/components/nav/mobile-nav'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { pretendard } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: '크보깡 어드민',
  description: '크보깡 카드·유저·경기 운영 어드민',
}

/**
 * 레이아웃: 전체화면 너비. 최대 폭 제한 없이 화면을 다 쓴다(테이블 열이 많음).
 * 사이드바는 배경색을 가진 sticky 컬럼, 본문은 남은 폭 전체.
 */
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ko" className={pretendard.variable}>
    <body>
      <TooltipProvider>
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

        <Toaster />
      </TooltipProvider>
    </body>
  </html>
)

export default RootLayout
