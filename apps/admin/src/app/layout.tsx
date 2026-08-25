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

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ko" className={pretendard.variable}>
    <body>
      <TooltipProvider>
        <Sidebar />

        <div className="lg:pl-60">
          <header className="bg-background/80 sticky top-0 z-10 flex h-16 items-center gap-2 border-b px-4 backdrop-blur lg:hidden">
            <MobileNav />
            <span className="text-sm font-bold">크보깡 어드민</span>
          </header>

          <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        <Toaster position="top-center" />
      </TooltipProvider>
    </body>
  </html>
)

export default RootLayout
