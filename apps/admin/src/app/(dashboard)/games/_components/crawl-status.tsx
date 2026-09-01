import { CircleCheck, CircleQuestionMark, TriangleAlert } from 'lucide-react'
import type { CrawlRun, GameWithStats } from '@kbokkang/shared'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * 크롤링 상태 확인 — 어드민 기획서 3.5.
 *
 * `crawl_runs` 를 읽는다. games 만 보면 **"경기 없는 날"과 "크롤러가 안 돌았다"를 구분할 수 없다**
 * (양쪽 다 0경기로 보인다). 실행 이력이 있어야 그 둘이 갈린다.
 */
type Tone = 'ok' | 'warn' | 'unknown'

interface Summary {
  readonly tone: Tone
  readonly message: string
}

/** 배너에 띄울 한 줄 요약을 정한다. 우선순위: 미실행 → 실패 → 결과 미수집 → 정상 */
const summarize = (run: CrawlRun | null, missingResult: number): Summary => {
  if (run === null) {
    return { tone: 'unknown', message: '수집 이력이 없습니다 — 크롤러가 이 날짜를 실행하지 않았습니다' }
  }

  if (!run.success) {
    return { tone: 'warn', message: `수집 실패 — ${run.error ?? '원인 미기록'}` }
  }

  if (missingResult > 0) {
    return {
      tone: 'warn',
      message: `결과 미수집 ${formatNumber(missingResult)}경기 — 수동 정산 필요`,
    }
  }

  if (run.gamesFound === 0) {
    return { tone: 'ok', message: '경기 없는 날 — 수집 정상' }
  }

  return { tone: 'ok', message: '수집 정상' }
}

const ICONS = {
  ok: CircleCheck,
  warn: TriangleAlert,
  unknown: CircleQuestionMark,
} as const

const SURFACES = {
  ok: 'border-success/30 bg-success/5',
  warn: 'border-warning/40 bg-warning/5',
  unknown: 'border-border bg-muted/40',
} as const

const TEXTS = {
  ok: 'text-success',
  warn: 'text-warning',
  unknown: 'text-muted-foreground',
} as const

export const CrawlStatus = ({
  date,
  games,
  run,
}: {
  date: string
  games: readonly GameWithStats[]
  run: CrawlRun | null
}) => {
  /** 종료됐는데 결과가 안 들어온 경기 — 수동 정산 대상 */
  const missingResult = games.filter(
    (game) =>
      (game.status === 'aggregating' || game.status === 'live') &&
      (game.homeScore === null || game.awayScore === null),
  ).length

  const settled = games.filter((game) => game.status === 'settled').length
  const { tone, message } = summarize(run, missingResult)
  const Icon = ICONS[tone]

  return (
    <Card className={cn('gap-0 py-4', SURFACES[tone])}>
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className={cn('size-4 shrink-0', TEXTS[tone])} aria-hidden />
          크롤링 상태
        </span>

        <span className="text-muted-foreground text-xs">{formatDate(date)}</span>

        {games.length > 0 && (
          <>
            <span className="text-xs">
              수집 <strong className="tabular">{formatNumber(games.length)}</strong>경기
            </span>
            <span className="text-xs">
              정산 완료 <strong className="tabular">{formatNumber(settled)}</strong>
            </span>
          </>
        )}

        <span className={cn('text-xs font-medium', TEXTS[tone])}>{message}</span>

        <span className="text-muted-foreground ml-auto text-[11px]">
          {run === null
            ? '지연 정산 허용 · 경기 시간대 30분 간격 수집'
            : `마지막 실행 ${formatDateTime(run.runAt)}`}
        </span>
      </CardContent>
    </Card>
  )
}
