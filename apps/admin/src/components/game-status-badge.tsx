import { GAME_STATUS_LABEL, type GameStatus } from '@kbokkang/shared'
import { cn } from '@/lib/utils'

/** 상태별 색. 진행 중(live)·집계 중(aggregating)만 눈에 띄게 한다. */
const STATUS_CLASS: Record<GameStatus, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground',
  live: 'bg-destructive/10 text-destructive',
  aggregating: 'bg-warning/15 text-warning',
  settled: 'bg-success/10 text-success',
}

/** 경기 상태 배지. 경기 목록·대시보드 공용. */
export const GameStatusBadge = ({
  status,
  className,
}: {
  status: GameStatus
  className?: string
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
      STATUS_CLASS[status],
      className,
    )}
  >
    {status === 'live' && (
      <span className="bg-destructive size-1.5 animate-pulse rounded-full" aria-hidden />
    )}
    {GAME_STATUS_LABEL[status]}
  </span>
)
