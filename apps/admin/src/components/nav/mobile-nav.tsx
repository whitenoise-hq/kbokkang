'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, isNavActive } from './nav-items'
import { LogoutButton } from './logout-button'

/** 좁은 화면용 시트 내비게이션. 구성은 사이드바와 동일하게 유지한다. */
export const MobileNav = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="메뉴 열기">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="bg-sidebar flex w-60 flex-col p-0">
        <SheetHeader className="h-16 justify-center px-4">
          <SheetTitle className="text-sidebar-foreground text-base font-bold tracking-tight">
            크보깡
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item, pathname)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-muted hover:bg-muted hover:text-sidebar-foreground font-medium',
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-sidebar-border border-t p-3">
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  )
}
