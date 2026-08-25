import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { pretendard } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: '크보깡 어드민',
  description: '크보깡 카드·유저·경기 운영 어드민',
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ko" className={pretendard.variable}>
    <body>{children}</body>
  </html>
)

export default RootLayout
