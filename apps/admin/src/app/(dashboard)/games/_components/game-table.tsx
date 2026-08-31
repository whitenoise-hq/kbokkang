import Link from 'next/link'
import { CalendarOff } from 'lucide-react'
import type { GameWithStats, Team } from '@kbokkang/shared'
import { GameStatusBadge } from '@/components/game-status-badge'
import { TeamLogo } from '@/components/team-logo'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber, formatTime, formatPercent, toPercent } from '@/lib/format'
import { SettleDialog } from './settle-dialog'

/** 수동 정산이 가능한 상태 — 시작 전(scheduled)과 이미 완료(settled)는 제외 */
const canSettle = (game: GameWithStats): boolean =>
  game.status === 'closed' || game.status === 'live' || game.status === 'aggregating'

/** 경기 목록 테이블 — 어드민 기획서 3.5 */
export const GameTable = ({
  games,
  teams,
}: {
  games: readonly GameWithStats[]
  teams: readonly Team[]
}) => {
  const teamOf = (id: number) => teams.find((team) => team.id === id)

  if (games.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="이 날짜에 경기가 없습니다"
        description="다른 날짜를 선택해 보세요"
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">시작</TableHead>
          <TableHead>경기</TableHead>
          <TableHead className="w-20 text-center">스코어</TableHead>
          <TableHead className="w-24">상태</TableHead>
          <TableHead className="w-32">예측 분포</TableHead>
          <TableHead className="w-28 text-right">정산</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {games.map((game) => {
          const homeTeam = teamOf(game.homeTeamId)
          const awayTeam = teamOf(game.awayTeamId)
          const homeRate = toPercent(game.homePickCount, game.predictionCount)

          return (
            <TableRow key={game.id}>
              <TableCell className="tabular text-xs">{formatTime(game.startAt)}</TableCell>

              <TableCell>
                {/* 엠블럼이 가운데(VS)를 향하도록 좌우 미러링 */}
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <span className="flex flex-1 items-center justify-end gap-2">
                    {awayTeam?.shortName ?? '-'}
                    <TeamLogo team={awayTeam} size="sm" />
                  </span>

                  <span className="text-muted-foreground shrink-0 text-[11px] font-semibold">
                    VS
                  </span>

                  <span className="flex flex-1 items-center gap-2">
                    <TeamLogo team={homeTeam} size="sm" />
                    {homeTeam?.shortName ?? '-'}
                    <span className="bg-muted text-muted-foreground shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold">
                      홈
                    </span>
                  </span>
                </Link>
              </TableCell>

              <TableCell className="tabular text-center text-sm font-semibold">
                {game.homeScore !== null && game.awayScore !== null ? (
                  `${game.awayScore} : ${game.homeScore}`
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>

              <TableCell>
                <GameStatusBadge status={game.status} />
              </TableCell>

              <TableCell>
                {game.predictionCount === 0 ? (
                  <span className="text-muted-foreground text-xs">예측 없음</span>
                ) : (
                  <div className="space-y-1">
                    <div className="bg-muted flex h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${homeRate}%` }}
                        title={`홈 ${String(game.homePickCount)}건`}
                      />
                    </div>
                    <p className="text-muted-foreground tabular text-[10px]">
                      홈 {formatPercent(homeRate, 0)} · 총 {formatNumber(game.predictionCount)}건
                    </p>
                  </div>
                )}
              </TableCell>

              <TableCell className="text-right">
                {canSettle(game) ? (
                  <SettleDialog game={game} homeTeam={homeTeam} awayTeam={awayTeam} />
                ) : game.status === 'settled' ? (
                  <span className="text-muted-foreground text-xs">완료</span>
                ) : (
                  <span className="text-muted-foreground text-xs">시작 전</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
