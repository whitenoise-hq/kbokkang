import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { pretendard } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: '크보깡 어드민',
  description: '크보깡 카드·유저·경기 운영 어드민',
}

/**
 * 루트 레이아웃 — 문서 골격과 전역 프로바이더만 담당한다.
 * 사이드바가 있는 어드민 셸은 `(dashboard)/layout.tsx`,
 * 로그인처럼 셸이 없어야 하는 화면은 그룹 밖에 둔다(URL은 그룹명에 영향받지 않음).
 */
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ko" className={pretendard.variable}>
    <body>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </body>
  </html>
)

export default RootLayout
