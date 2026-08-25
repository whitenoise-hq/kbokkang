import { BarChart3, Gauge, Layers, ScrollText, Shield, Trophy, Upload, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  readonly href: string
  readonly label: string
  readonly icon: LucideIcon
  /** 하위 경로까지 활성 처리할지 (목록 → 상세 이동 시 메뉴 유지) */
  readonly matchPrefix: boolean
}

/** 사이드바 메뉴 — 어드민 기획서 3장 + 구단 관리(스키마엔 있으나 기획서 누락분) */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: '대시보드', icon: Gauge, matchPrefix: false },
  { href: '/cards', label: '카드 관리', icon: Layers, matchPrefix: true },
  { href: '/cards/bulk', label: '카드 일괄 업로드', icon: Upload, matchPrefix: false },
  { href: '/users', label: '유저 관리', icon: Users, matchPrefix: true },
  { href: '/games', label: '경기 관리', icon: Trophy, matchPrefix: true },
  { href: '/teams', label: '구단 관리', icon: Shield, matchPrefix: true },
  { href: '/stats', label: '통계', icon: BarChart3, matchPrefix: true },
  { href: '/rules', label: '규칙 확인', icon: ScrollText, matchPrefix: true },
]

/** 현재 경로에 해당하는 메뉴인지 — /cards/bulk 는 /cards 보다 우선한다 */
export const isNavActive = (item: NavItem, pathname: string): boolean => {
  if (item.href === '/cards' && pathname.startsWith('/cards/bulk')) return false
  if (!item.matchPrefix) return pathname === item.href

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
