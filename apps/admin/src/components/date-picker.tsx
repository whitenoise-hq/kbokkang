'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateWithWeekday, todayInKst, weekdayLabels } from '@/lib/format'

/**
 * 직접 만든 날짜 선택 캘린더(hatch-it 규격). 별도 캘린더 라이브러리를 쓰지 않는다.
 *
 * hatch-it 원본은 모집 마감일용이라 과거 날짜를 막지만, 어드민은 지난 경기도 조회해야 하므로
 * 제한은 minDate/maxDate 옵션으로만 둔다(기본 제한 없음).
 *
 * value/onChange 는 ISO 날짜(YYYY-MM-DD). 필터 용도라 null(미선택)을 허용한다.
 */

const pad = (value: number): string => String(value).padStart(2, '0')

const toIsoDate = (year: number, monthIndex: number, day: number): string =>
  `${String(year)}-${pad(monthIndex + 1)}-${pad(day)}`

/** 해당 월 그리드. 앞뒤 빈칸(null) 포함해 7의 배수로 채운다. */
const buildGrid = (year: number, monthIndex: number): readonly (number | null)[] => {
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()

  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= lastDay; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

export const DatePicker = ({
  value,
  onChange,
  placeholder = '날짜 선택',
  minDate,
  maxDate,
  clearable = true,
  className,
}: {
  value: string | null
  onChange: (isoDate: string | null) => void
  placeholder?: string
  /** 이 날짜보다 이전은 선택 불가 (YYYY-MM-DD) */
  minDate?: string
  /** 이 날짜보다 이후는 선택 불가 (YYYY-MM-DD) */
  maxDate?: string
  clearable?: boolean
  className?: string
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const today = todayInKst()

  const [view, setView] = useState(() => {
    const base = value ?? today
    const [year, month] = base.split('-').map(Number)
    return { year: year ?? 2026, monthIndex: (month ?? 1) - 1 }
  })

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const grid = useMemo(() => buildGrid(view.year, view.monthIndex), [view])

  const shiftMonth = (delta: number) => {
    setView((prev) => {
      const next = new Date(prev.year, prev.monthIndex + delta, 1)
      return { year: next.getFullYear(), monthIndex: next.getMonth() }
    })
  }

  const jumpTo = (isoDate: string) => {
    const [year, month] = isoDate.split('-').map(Number)
    setView({ year: year ?? view.year, monthIndex: (month ?? 1) - 1 })
    onChange(isoDate)
    setOpen(false)
  }

  const isDisabled = (isoDate: string): boolean =>
    (minDate !== undefined && isoDate < minDate) || (maxDate !== undefined && isoDate > maxDate)

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'bg-card flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors',
          value === null ? 'text-muted-foreground' : 'text-foreground',
          open && 'border-primary',
        )}
      >
        <span className="tabular truncate">
          {value === null ? placeholder : formatDateWithWeekday(value)}
        </span>
        <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </button>

      {open && (
        <div className="bg-card animate-rise shadow-float absolute z-20 mt-1.5 w-[280px] rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => shiftMonth(-1)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-7 place-items-center rounded-md transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="tabular text-sm font-semibold">
              {view.year}년 {view.monthIndex + 1}월
            </span>

            <button
              type="button"
              aria-label="다음 달"
              onClick={() => shiftMonth(1)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-7 place-items-center rounded-md transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {weekdayLabels.map((label, index) => (
              <div
                key={label}
                className={cn(
                  'py-1 text-center text-[11px] font-medium',
                  index === 0
                    ? 'text-destructive'
                    : index === 6
                      ? 'text-primary'
                      : 'text-muted-foreground',
                )}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((day, index) => {
              if (day === null) return <div key={`empty-${String(index)}`} />

              const isoDate = toIsoDate(view.year, view.monthIndex, day)
              const disabled = isDisabled(isoDate)
              const selected = isoDate === value
              const isToday = isoDate === today
              const weekday = index % 7

              return (
                <button
                  key={isoDate}
                  type="button"
                  disabled={disabled}
                  onClick={() => jumpTo(isoDate)}
                  className={cn(
                    'tabular grid h-8 place-items-center rounded-md text-sm transition-colors',
                    disabled && 'text-muted-foreground/40',
                    !disabled && !selected && 'hover:bg-muted',
                    !disabled &&
                      !selected &&
                      (weekday === 0
                        ? 'text-destructive'
                        : weekday === 6
                          ? 'text-primary'
                          : 'text-foreground'),
                    selected && 'bg-primary text-primary-foreground font-semibold',
                    isToday && !selected && 'ring-primary/40 font-semibold ring-1',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-1 border-t pt-2">
            <button
              type="button"
              onClick={() => jumpTo(today)}
              className="text-primary hover:bg-muted rounded-md px-2 py-1 text-xs font-semibold transition-colors"
            >
              오늘
            </button>

            {clearable && value !== null && (
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="text-muted-foreground hover:bg-muted hover:text-foreground ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
              >
                <X className="size-3" />
                선택 해제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
