import Link from 'next/link'
import { CalendarOff, ChevronRight } from 'lucide-react'
import type { GameWithStats, Team } from '@kbokkang/shared'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameStatusBadge } from '@/components/game-status-badge'
import { TeamLogo } from '@/components/team-logo'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import { formatNumber, formatTime } from '@/lib/format'

/**
 * 로고 + 약칭. 로고는 teams.logo_url 이 채워지면 자동으로 표시된다(TeamLogo 참조).
 * 원정은 좌측, 홈은 우측 정렬해 가운데 스코어를 기준으로 대칭을 만든다.
 */
const TeamLabel = ({ team, align }: { team: Team | undefined; align: 'left' | 'right' }) => (
  <span
    className={cn(
      'flex min-w-0 flex-1 items-center gap-2',
      align === 'right' && 'flex-row-reverse',
    )}
  >
    <TeamLogo team={team} />
    <span className="truncate text-sm font-semibold">{team?.shortName ?? '-'}</span>
  </span>
)

/**
 * 오늘 경기 (대시보드).
 * 폭이 좁은 카드라 요약만 보여주고, 자세한 건 경기 관리 화면에서 본다.
 */
export const TodayGames = ({
  games,
  teams,
}: {
  games: readonly GameWithStats[]
  teams: readonly Team[]
}) => {
  const teamOf = (id: number) => teams.find((team) => team.id === id)

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base">오늘 경기</CardTitle>
        <p className="text-muted-foreground text-xs">
          {games.length === 0
            ? '경기 없음'
            : `${String(games.length)}경기 · 정산 완료 ${String(games.filter((game) => game.status === 'settled').length)}`}
        </p>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/games">
              전체 보기
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className={games.length === 0 ? undefined : 'space-y-1.5'}>
        {games.length === 0 ? (
          <EmptyState icon={CalendarOff} title="오늘은 경기가 없습니다" />
        ) : (
          games.map((game) => {
            const hasScore = game.homeScore !== null && game.awayScore !== null

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="hover:bg-muted/60 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              >
                <TeamLabel team={teamOf(game.awayTeamId)} align="left" />

                <span className="flex w-20 shrink-0 flex-col items-center">
                  {hasScore ? (
                    <span className="tabular text-base font-bold">
                      {game.awayScore} : {game.homeScore}
                    </span>
                  ) : (
                    <span className="tabular text-muted-foreground text-sm font-medium">
                      {formatTime(game.startAt)}
                    </span>
                  )}
                  <span className="text-muted-foreground text-[10px]">
                    예측 {formatNumber(game.predictionCount)}
                  </span>
                </span>

                <TeamLabel team={teamOf(game.homeTeamId)} align="right" />

                <GameStatusBadge status={game.status} className="w-16 justify-center" />
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
