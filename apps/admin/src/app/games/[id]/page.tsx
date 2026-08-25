import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Users } from 'lucide-react'
import { PREDICTION_RESULT_LABEL } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { GameStatusBadge } from '@/components/game-status-badge'
import { TeamLogo } from '@/components/team-logo'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { repositories } from '@/lib/repositories'
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatSignedPoints,
  formatTime,
  toPercent,
} from '@/lib/format'

/** 예측 결과별 배지 색 */
const RESULT_CLASS = {
  pending: 'bg-muted text-muted-foreground',
  win_hit: 'bg-success/10 text-success',
  score_hit: 'bg-success/15 text-success',
  miss: 'bg-muted text-muted-foreground',
} as const

/** 경기 상세 + 예측 로그 — 어드민 기획서 3.5 */
const GameDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const [game, teams, predictions] = await Promise.all([
    repositories.games.findById(id),
    repositories.teams.list(),
    repositories.games.predictionsOf(id),
  ])

  if (game === null) notFound()

  const homeTeam = teams.find((team) => team.id === game.homeTeamId)
  const awayTeam = teams.find((team) => team.id === game.awayTeamId)

  const homePicks = predictions.filter((item) => item.pickWinner === 'home').length
  const awayPicks = predictions.length - homePicks
  const scorePicks = predictions.filter((item) => item.pickHomeScore !== null).length
  const hits = predictions.filter(
    (item) => item.result === 'win_hit' || item.result === 'score_hit',
  ).length
  const paidPoints = predictions.reduce((sum, item) => sum + (item.earnedPoints ?? 0), 0)

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/games">
          <ChevronLeft className="size-4" />
          경기 목록
        </Link>
      </Button>

      <PageHeader
        title={`${awayTeam?.shortName ?? '원정'} VS ${homeTeam?.shortName ?? '홈'}`}
        description={`${formatDate(game.gameDate)} ${formatTime(game.startAt)} 시작 · 예측 마감 ${formatDateTime(game.predictCloseAt)}`}
        action={<GameStatusBadge status={game.status} />}
      />

      {/* 스코어보드 */}
      <Card>
        <CardContent className="flex items-center justify-center gap-8 py-2">
          <div className="flex flex-col items-center gap-2">
            <TeamLogo team={awayTeam} />
            <span className="text-sm font-semibold">{awayTeam?.shortName ?? '-'}</span>
            <span className="text-muted-foreground text-[11px]">원정</span>
          </div>

          <div className="flex flex-col items-center">
            {game.homeScore !== null && game.awayScore !== null ? (
              <span className="tabular text-4xl font-bold tracking-tight">
                {game.awayScore} : {game.homeScore}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">결과 미입력</span>
            )}
            {game.settledAt !== null && (
              <span className="text-muted-foreground mt-1 text-[11px]">
                {formatDateTime(game.settledAt)} 정산
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <TeamLogo team={homeTeam} />
            <span className="text-sm font-semibold">{homeTeam?.shortName ?? '-'}</span>
            <span className="text-muted-foreground text-[11px]">홈</span>
          </div>
        </CardContent>
      </Card>

      {/* 예측 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">예측 분포</CardTitle>
          <p className="text-muted-foreground text-xs">
            총 {formatNumber(predictions.length)}건 · 스코어 예측 {formatNumber(scorePicks)}건 ·
            지급 포인트 {formatNumber(paidPoints)}p
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="bg-muted flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-l-full"
              style={{ width: `${toPercent(awayPicks, predictions.length)}%` }}
            />
            <div
              className="bg-muted-foreground/40 h-full rounded-r-full"
              style={{ width: `${toPercent(homePicks, predictions.length)}%` }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="bg-primary size-2.5 shrink-0 rounded-full" aria-hidden />
              <span className="text-muted-foreground text-sm">
                {awayTeam?.shortName ?? '원정'} 승
              </span>
              <span className="tabular ml-auto text-sm font-bold">{formatNumber(awayPicks)}</span>
              <span className="text-muted-foreground tabular w-9 text-right text-[11px]">
                {formatPercent(toPercent(awayPicks, predictions.length), 0)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-muted-foreground/40 size-2.5 shrink-0 rounded-full" aria-hidden />
              <span className="text-muted-foreground text-sm">
                {homeTeam?.shortName ?? '홈'} 승
              </span>
              <span className="tabular ml-auto text-sm font-bold">{formatNumber(homePicks)}</span>
              <span className="text-muted-foreground tabular w-9 text-right text-[11px]">
                {formatPercent(toPercent(homePicks, predictions.length), 0)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">적중</span>
              <span className="tabular ml-auto text-sm font-bold">{formatNumber(hits)}</span>
              <span className="text-muted-foreground tabular w-9 text-right text-[11px]">
                {formatPercent(toPercent(hits, predictions.length), 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예측 로그 */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="pt-6">
          <CardTitle className="text-base">예측 로그</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users">유저 관리</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {predictions.length === 0 ? (
            <EmptyState icon={Users} title="예측 기록이 없습니다" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유저</TableHead>
                  <TableHead className="w-24">승패 예측</TableHead>
                  <TableHead className="w-24 text-center">스코어 예측</TableHead>
                  <TableHead className="w-24">결과</TableHead>
                  <TableHead className="w-24 text-right">지급</TableHead>
                  <TableHead className="w-36">예측 시각</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {predictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell>
                      <Link
                        href={`/users/${prediction.userId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {prediction.userNickname}
                      </Link>
                    </TableCell>

                    <TableCell className="text-sm">
                      {prediction.pickWinner === 'home'
                        ? (homeTeam?.shortName ?? '홈')
                        : (awayTeam?.shortName ?? '원정')}
                    </TableCell>

                    <TableCell className="tabular text-center text-sm">
                      {prediction.pickAwayScore !== null && prediction.pickHomeScore !== null ? (
                        `${prediction.pickAwayScore} : ${prediction.pickHomeScore}`
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {prediction.result === null ? (
                        <span className="text-muted-foreground text-xs">-</span>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`border-0 ${RESULT_CLASS[prediction.result]}`}
                        >
                          {PREDICTION_RESULT_LABEL[prediction.result]}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="tabular text-right text-sm">
                      {prediction.earnedPoints === null || prediction.earnedPoints === 0 ? (
                        <span className="text-muted-foreground text-xs">-</span>
                      ) : (
                        <span className="text-success font-semibold">
                          {formatSignedPoints(prediction.earnedPoints)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="tabular text-muted-foreground text-xs">
                      {formatDateTime(prediction.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default GameDetailPage
