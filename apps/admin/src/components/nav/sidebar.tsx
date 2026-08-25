'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, isNavActive } from './nav-items'

/** 좌측 고정 사이드바. 평면 나열 8개 메뉴. */
export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="bg-card fixed inset-y-0 left-0 hidden w-60 flex-col border-r lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold">
          깡
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">크보깡</p>
          <p className="text-muted-foreground text-[11px]">어드민</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item, pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="text-muted-foreground border-t px-5 py-3 text-[11px]">
        목업 데이터 · DB 미연결
      </div>
    </aside>
  )
}
