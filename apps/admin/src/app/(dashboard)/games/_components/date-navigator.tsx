'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GAME_STATUSES, GAME_STATUS_LABEL } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { shiftIsoDate } from '@/lib/format'

const ALL = 'all'

/**
 * 경기 관리는 하루 단위로만 조회한다(KBO는 하루 최대 5경기).
 * 날짜는 항상 선택돼 있고(기본 오늘), 이전/다음 날로 이동한다.
 */
export const DateNavigator = ({ date, today }: { date: string; today: string }) => {
  const router = useRouter()
  const params = useSearchParams()

  const status = params.get('status') ?? ALL

  const go = useCallback(
    (nextDate: string, nextStatus: string) => {
      const query = new URLSearchParams()
      query.set('date', nextDate)
      if (nextStatus !== ALL) query.set('status', nextStatus)

      router.replace(`/games?${query.toString()}`)
    },
    [router],
  )

  return (
    <div className="bg-card shadow-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
      <Button
        variant="outline"
        size="icon"
        aria-label="이전 날"
        onClick={() => go(shiftIsoDate(date, -1), status)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <DatePicker
        value={date}
        onChange={(isoDate) => go(isoDate ?? today, status)}
        clearable={false}
        className="w-44"
      />

      <Button
        variant="outline"
        size="icon"
        aria-label="다음 날"
        onClick={() => go(shiftIsoDate(date, 1), status)}
      >
        <ChevronRight className="size-4" />
      </Button>

      <Button
        variant={date === today ? 'secondary' : 'outline'}
        size="sm"
        disabled={date === today}
        onClick={() => go(today, status)}
      >
        오늘
      </Button>

      <Select value={status} onValueChange={(value) => go(date, value)}>
        <SelectTrigger className="ml-auto w-32" aria-label="상태 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 상태</SelectItem>
          {GAME_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {GAME_STATUS_LABEL[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
