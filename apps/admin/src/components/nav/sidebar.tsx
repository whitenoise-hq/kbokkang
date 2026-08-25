'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, isNavActive } from './nav-items'
import { Logo } from './logo'
import { LogoutButton } from './logout-button'

/**
 * 사이드바. 배경색(--sidebar)으로 본문과 구분되는 sticky 컬럼.
 * 상단은 로고, 하단은 admin 배지 + 로그아웃.
 */
export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 items-center px-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item, pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                  : 'text-sidebar-muted hover:bg-muted hover:text-sidebar-foreground font-medium',
              )}
            >
              <item.icon
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  active
                    ? 'text-sidebar-accent-foreground'
                    : 'text-sidebar-muted group-hover:text-sidebar-foreground',
                )}
                aria-hidden
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-sidebar-border border-t p-3">
        <LogoutButton />
      </div>
    </aside>
  )
}
