import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { GameWithStats } from '@kbokkang/shared'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * 크롤링 상태 확인 — 어드민 기획서 3.5.
 *
 * 스키마 한계: 현재 5장 스키마에는 '마지막 수집 시각'·'수집 실패 여부'를 담을 곳이 없다.
 * 그래서 games 데이터에서 유추할 수 있는 것만 보여준다.
 * 3단계에서 crawl_runs(수집 시각·성공여부·대상 날짜) 테이블 추가를 검토할 항목.
 */
export const CrawlStatus = ({ date, games }: { date: string; games: readonly GameWithStats[] }) => {
  const notCollected = games.length === 0
  /** 종료됐는데 결과가 안 들어온 경기 — 수동 정산 대상 */
  const missingResult = games.filter(
    (game) =>
      (game.status === 'aggregating' || game.status === 'live') &&
      (game.homeScore === null || game.awayScore === null),
  )
  const settled = games.filter((game) => game.status === 'settled')

  const hasProblem = notCollected || missingResult.length > 0

  return (
    <Card
      className={cn(
        'gap-0 py-4',
        hasProblem ? 'border-warning/40 bg-warning/5' : 'border-success/30 bg-success/5',
      )}
    >
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {hasProblem ? (
            <TriangleAlert className="text-warning size-4 shrink-0" aria-hidden />
          ) : (
            <CircleCheck className="text-success size-4 shrink-0" aria-hidden />
          )}
          크롤링 상태
        </span>

        <span className="text-muted-foreground text-xs">{formatDate(date)}</span>

        {notCollected ? (
          <span className="text-warning text-xs font-medium">
            수집된 경기가 없습니다 — 경기 없는 날이거나 크롤링 미실행
          </span>
        ) : (
          <>
            <span className="text-xs">
              수집 <strong className="tabular">{formatNumber(games.length)}</strong>경기
            </span>
            <span className="text-xs">
              정산 완료 <strong className="tabular">{formatNumber(settled.length)}</strong>
            </span>
            {missingResult.length > 0 && (
              <span className="text-warning text-xs font-medium">
                결과 미수집 {formatNumber(missingResult.length)}경기 — 수동 정산 필요
              </span>
            )}
          </>
        )}

        <span className="text-muted-foreground ml-auto text-[11px]">
          지연 정산 허용 · 경기 시간대 30분 간격 수집
        </span>
      </CardContent>
    </Card>
  )
}
